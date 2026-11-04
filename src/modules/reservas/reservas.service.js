// src/modules/reservas/reservas.service.js
const pool = require('../../config/database');
const QRCode = require('qrcode');

/**
 * Busca si existe una reserva activa y pendiente para el alumno y slot indicados en una fecha específica.
 */
async function buscarReservaActiva(codigoAlumno, idEspacio, fechaReserva) {
    const query = `
        SELECT id_reserva, hora_llegada_programada FROM reservas 
        WHERE codigo_alumno = $1 AND id_espacio = $2 
          AND fecha_reserva = $3 AND estado_reserva = 'PENDIENTE'
    `;
    const { rows } = await pool.query(query, [codigoAlumno, idEspacio, fechaReserva]);
    return rows[0]; 
}

/**
 * Procesa el ingreso físico del vehículo cambiando el estado de la reserva y del espacio.
 */
async function ejecutarIngresoTransaccional(idReserva, idEspacio) {
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN');

        // 1. Cambiar el estado de la reserva pendiente a COMPLETADA
        const queryReserva = `
            UPDATE reservas 
            SET estado_reserva = 'COMPLETADA' 
            WHERE id_reserva = $1::integer
        `;
        await clienteBD.query(queryReserva, [idReserva]);

        // 2. Cambiar el estado físico del slot de estacionamiento a OCUPADO
        const queryEspacio = `
            UPDATE espacios_estacionamiento 
            SET estado = 'OCUPADO' 
            WHERE id_espacio = $2::varchar
        `;
        await clienteBD.query(queryEspacio, [idEspacio]);

        await clienteBD.query('COMMIT');
        return true;
    } catch (error) {
        await clienteBD.query('ROLLBACK');
        throw error;
    } finally {
        clienteBD.release();
    }
}

/**
 * Libera de forma atómica el espacio físico al retirarse el automóvil de la universidad.
 */
async function ejecutarSalidaTransaccional(idEspacio) {
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN');

        // 1. Modificar la reserva del día a estado FINALIZADA
        await clienteBD.query(`
            UPDATE reservas 
            SET estado_reserva = 'FINALIZADA' 
            WHERE id_espacio = $1 AND fecha_reserva = CURRENT_DATE AND estado_reserva = 'COMPLETADA'
        `, [idEspacio]);

        // 2. Devolver el espacio físico a estado DISPONIBLE
        await clienteBD.query(
            "UPDATE espacios_estacionamiento SET estado = 'DISPONIBLE' WHERE id_espacio = $1", 
            [idEspacio]
        );

        await clienteBD.query('COMMIT');
        return true;
    } catch (error) {
        await clienteBD.query('ROLLBACK');
        throw error;
    } finally {
        clienteBD.release();
    }
}

/**
 * Consulta el estado actual de todos los espacios de estacionamiento en la base de datos.
 */
async function obtenerTodosLosEspacios() {
    const query = `
        SELECT id_espacio, piso, numero_slot, estado, tipo_vehiculo 
        FROM espacios_estacionamiento 
        ORDER BY id_espacio ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
}

/**
 * Crea una reserva de forma atómica verificando la disponibilidad del slot para la fecha de llegada.
 */
async function ejecutarReservaTransaccional(codigoAlumno, idEspacio, codigoOtpUsado, fechaReserva, horaLlegadaProgramada) {
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN');

        // 1. Bloquear y verificar el estado actual del espacio
        const verificarQuery = `
            SELECT estado FROM espacios_estacionamiento 
            WHERE id_espacio = $1 FOR UPDATE
        `;
        const { rows } = await clienteBD.query(verificarQuery, [idEspacio]);
        
        if (!rows || rows.length === 0) {
            throw new Error('El espacio seleccionado no existe.');
        }
        
        const espacioFisico = rows[0];
        if (espacioFisico.estado !== 'DISPONIBLE') {
            throw new Error('El espacio ya no se encuentra disponible.');
        }

        // 2. Insertar el registro oficial de la reserva
        const insertarReservaQuery = `
            INSERT INTO reservas (codigo_alumno, id_espacio, codigo_otp_usado, fecha_reserva, hora_llegada_programada, estado_reserva)
            VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
            RETURNING *;
        `;
        
        const resultadoReserva = await clienteBD.query(insertarReservaQuery, [
            codigoAlumno, 
            idEspacio, 
            codigoOtpUsado, 
            fechaReserva, 
            horaLlegadaProgramada
        ]);

        // 3. Cambiar el estado del espacio físico a RESERVADO
        const actualizarEspacioQuery = `
            UPDATE espacios_estacionamiento 
            SET estado = 'RESERVADO' 
            WHERE id_espacio = $1
        `;
        await clienteBD.query(actualizarEspacioQuery, [idEspacio]);

        await clienteBD.query('COMMIT');

        // 4. Generar el QR de la reserva en Base64
        const payloadQR = JSON.stringify({
            codigoAlumno,
            idEspacio,
            fechaReserva,
            horaLlegadaProgramada
        });
        const qrCodeBase64 = await QRCode.toDataURL(payloadQR, { margin: 2, width: 250 });

        return {
            reserva: resultadoReserva.rows[0],
            qrCode: qrCodeBase64
        };
 
    } catch (error) {
        await clienteBD.query('ROLLBACK');
        throw error;
    } finally {
        clienteBD.release();
    }
}

/**
 * Cancela una reserva pendiente de forma atómica y libera el slot físico.
 */
async function ejecutarCancelacionTransaccional(codigoAlumno, fechaReserva) {
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN');

        const buscarQuery = `
            SELECT id_reserva, id_espacio FROM reservas 
            WHERE codigo_alumno = $1 AND fecha_reserva = $2 AND estado_reserva = 'PENDIENTE'
            FOR UPDATE
        `;
        const { rows } = await clienteBD.query(buscarQuery, [codigoAlumno, fechaReserva]);

        if (rows.length === 0) {
            throw new Error('No se encontró ninguna reserva pendiente para cancelar en la fecha seleccionada.');
        }

        const reserva = rows[0];

        await clienteBD.query(
            "UPDATE reservas SET estado_reserva = 'CANCELADA' WHERE id_reserva = $1",
            [reserva.id_reserva]
        );

        await clienteBD.query(
            "UPDATE espacios_estacionamiento SET estado = 'DISPONIBLE' WHERE id_espacio = $1",
            [reserva.id_espacio]
        );

        await clienteBD.query('COMMIT');
        return true;
    } catch (error) {
        await clienteBD.query('ROLLBACK');
        throw error;
    } finally {
        clienteBD.release();
    }
}

/**
 * Consulta el listado de reservas históricas y futuras de un alumno específico (Mockup E06).
 */
async function obtenerReservasPorAlumno(codigoAlumno) {
    const query = `
        SELECT 
            r.id_reserva,
            r.codigo_alumno,
            r.id_espacio,
            r.codigo_otp_usado,
            r.fecha_reserva,
            r.hora_llegada_programada,
            r.estado_reserva,
            e.piso,
            e.numero_slot,
            e.tipo_vehiculo
        FROM reservas r
        LEFT JOIN espacios_estacionamiento e ON r.id_espacio = e.id_espacio
        WHERE r.codigo_alumno = $1
        ORDER BY r.fecha_reserva DESC, r.hora_llegada_programada DESC
    `;
    const { rows } = await pool.query(query, [codigoAlumno]);
    return rows;
}

module.exports = {
    buscarReservaActiva,
    ejecutarIngresoTransaccional,
    ejecutarSalidaTransaccional,
    obtenerTodosLosEspacios,
    ejecutarReservaTransaccional,
    ejecutarCancelacionTransaccional,
    obtenerReservasPorAlumno
};