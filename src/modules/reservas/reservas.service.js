// src/modules/reservas/reservas.service.js
const pool = require('../../config/database');

/**
 * Busca si existe una reserva activa y pendiente para el alumno y slot indicados en una fecha específica.
 */
async function buscarReservaActiva(codigoAlumno, idEspacio, fechaReserva) {
    const query = `
        SELECT id_reserva FROM reservas 
        WHERE codigo_alumno = $1 AND id_espacio = $2 
          AND fecha_reserva = $3 AND estado_reserva = 'PENDIENTE'
    `;
    const { rows } = await pool.query(query, [codigoAlumno, idEspacio, fechaReserva]);
    return rows[0]; 
}



/**
 * Registra atómicamente el ingreso vehicular cambiando el estado de la reserva y el slot.
 */
async function ejecutarIngresoTransaccional(idReserva, idEspacio) {
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN'); 

        await clienteBD.query(
            "UPDATE reservas SET estado_reserva = 'COMPLETADA' WHERE id_reserva = \$1", 
            [idReserva]
        );

        await clienteBD.query(
            "UPDATE espacios_estacionamiento SET estado = 'OCUPADO' WHERE id_espacio = \$2", 
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
async function ejecutarReservaTransaccional(codigoAlumno, idEspacio, codigoOtpUsado, fechaReserva) {
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
            INSERT INTO reservas (codigo_alumno, id_espacio, codigo_otp_usado, fecha_reserva, estado_reserva)
            VALUES ($1, $2, $3, $4, 'PENDIENTE')
        `;
        await clienteBD.query(insertarReservaQuery, [codigoAlumno, idEspacio, codigoOtpUsado, fechaReserva]);

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



// Exportación completa incluyendo el nuevo método
module.exports = {
    buscarReservaActiva,
    ejecutarIngresoTransaccional,
    ejecutarSalidaTransaccional,
    obtenerTodosLosEspacios, // 👈 Agregado
    ejecutarReservaTransaccional // 👈 Agregad  o
};

