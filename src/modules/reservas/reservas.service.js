// src/modules/reservas/reservas.service.js
const pool = require('../../config/database');

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
 * Archivo: src/modules/reservas/reservas.service.js
 */
async function ejecutarIngresoTransaccional(idReserva, idEspacio) {
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN'); // 🔒 Inicio de Bloqueo Atómico

        // 1. Cambiar el estado de la reserva pendiente a COMPLETADA
        // 🚀 CORRECCIÓN DE ORO: Agregamos ::integer para evitar el error de tipo de dato
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

        await clienteBD.query('COMMIT'); // 💾 Guardar cambios de forma irrevocable
        return true;
    } catch (error) {
        await clienteBD.query('ROLLBACK'); // 🔄 Deshacer todo en caso de cualquier fallo
        throw error;
    } finally {
        clienteBD.release(); // 🔌 Liberar la conexión al pool
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

        // 2. Devolver el espacio físico a estado DISPONIBLE (Vuelve a verde en el mapa web)
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
    return rows; // Retorna la lista de slots con sus estados en tiempo real
}

/**
 * Crea una reserva de forma atómica verificando la disponibilidad del slot para la fecha de llegada.
 */
/**
 * Crea una reserva de forma atómica verificando la disponibilidad del slot para la fecha de llegada.
 */
async function ejecutarReservaTransaccional(codigoAlumno, idEspacio, codigoOtpUsado, fechaReserva, horaLlegadaProgramada) {
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN'); // Inicio de Transacción Segura

        // 1. Bloquear y verificar el estado actual del espacio
        const verificarQuery = `
            SELECT estado FROM espacios_estacionamiento 
            WHERE id_espacio = $1 FOR UPDATE
        `;
        const { rows } = await clienteBD.query(verificarQuery, [idEspacio]);
        
        // 🚀 EVALUACIÓN CORRECTA: Verificar si el array tiene elementos antes de indexar
        if (!rows || rows.length === 0) {
            throw new Error('El espacio seleccionado no existe.');
        }
        
        // 🚀 EXTRAER EL OBJETO FÍSICO REAL (Índice 0)
        const espacioFisico = rows[0];
        if (espacioFisico.estado !== 'DISPONIBLE') {
            throw new Error('El espacio ya no se encuentra disponible.');
        }

        // 2. Insertar el registro oficial de la reserva (Sin barras invertidas)
        const insertarReservaQuery = `
            INSERT INTO reservas (codigo_alumno, id_espacio, codigo_otp_usado, fecha_reserva, hora_llegada_programada, estado_reserva)
            VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
        `;
        await clienteBD.query(insertarReservaQuery, [codigoAlumno, idEspacio, codigoOtpUsado, fechaReserva, horaLlegadaProgramada]);

        // 3. Cambiar el estado del espacio físico a RESERVADO
        const actualizarEspacioQuery = `
            UPDATE espacios_estacionamiento 
            SET estado = 'RESERVADO' 
            WHERE id_espacio = $1
        `;
        await clienteBD.query(actualizarEspacioQuery, [idEspacio]);

        await clienteBD.query('COMMIT'); // Persistencia total
        return true;
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

        // 1. Buscar la reserva pendiente para hoy o mañana de ese alumno y bloquear la fila
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

        // 2. Actualizar el estado de la transacción lúdica a CANCELADA
        await clienteBD.query(
            "UPDATE reservas SET estado_reserva = 'CANCELADA' WHERE id_reserva = \$1",
            [reserva.id_reserva]
        );

        // 3. Devolver el espacio de estacionamiento a DISPONIBLE
        await clienteBD.query(
            "UPDATE espacios_estacionamiento SET estado = 'DISPONIBLE' WHERE id_espacio = \$1",
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


// Exportación completa incluyendo el nuevo método
module.exports = {
    buscarReservaActiva,
    ejecutarIngresoTransaccional,
    ejecutarSalidaTransaccional,
    obtenerTodosLosEspacios, // 👈 Agregado
    ejecutarReservaTransaccional, // 👈 Agregad  o
    ejecutarCancelacionTransaccional // 👈 Agregad  o
};

