const pool = require('../../config/database');

/**
 * ENDPOINT 1: GET /api/garita/espacios
 * Permite al monitor de garita ver todos los espacios de Lima Centro y su estado actual en tiempo real.
 */
async function obtenerEspaciosGarita(req, res) {
    try {
        const query = `
            SELECT id_espacio, piso, numero_slot, estado, tipo_vehiculo 
            FROM espacios_estacionamiento 
            ORDER BY piso ASC, numero_slot ASC
        `;
        const { rows } = await pool.query(query);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener espacios para la garita:', error);
        return res.status(500).json({ error: 'Error al consultar el mapa de estacionamientos.' });
    }
}

/**
 * ENDPOINT 2: POST /api/garita/registrar-ingreso
 * Cambia el estado del espacio de 'RESERVADO' a 'OCUPADO' cuando el alumno llega a la cochera.
 */
async function registrarIngresoVehiculo(req, res) {
    const { codigo_alumno, id_espacio } = req.body;

    const clienteBD = await pool.connect();
    try {
        // Iniciamos transacción para garantizar consistencia atómica
        await clienteBD.query('BEGIN');

        // 1. Validar que exista la reserva activa pendiente para el día de hoy
        const queryVerificarReserva = `
            SELECT id_reserva FROM reservas 
            WHERE codigo_alumno = $1 AND id_espacio = $2 
              AND fecha_reserva = CURRENT_DATE AND estado_reserva = 'PENDIENTE'
        `;
        const resReserva = await clienteBD.query(queryVerificarReserva, [codigo_alumno, id_espacio]);

        if (resReserva.rows.length === 0) {
            await clienteBD.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'No se encontró una reserva pendiente válida para este alumno y espacio el día de hoy.' 
            });
        }

        const idReserva = resReserva.rows[0].id_reserva;

        // 2. Actualizar el estado de la reserva a COMPLETADA
        const queryActualizarReserva = `
            UPDATE reservas SET estado_reserva = 'COMPLETADA' 
            WHERE id_reserva = $1
        `;
        await clienteBD.query(queryActualizarReserva, [idReserva]);

        // 3. Actualizar el estado del espacio físico a OCUPADO (Cambia a color rojo en el mapa general)
        const queryActualizarEspacio = `
            UPDATE espacios_estacionamiento SET estado = 'OCUPADO' 
            WHERE id_espacio = $1
        `;
        await clienteBD.query(queryActualizarEspacio, [id_espacio]);

        // Confirmamos todos los cambios en la base de datos única
        await clienteBD.query('COMMIT');

        return res.status(200).json({ 
            mensaje: `Ingreso registrado exitosamente. Espacio ${id_espacio} marcado como ocupado.` 
        });

    } catch (error) {
        await clienteBD.query('ROLLBACK');
        console.error('Error al registrar ingreso en garita:', error);
        return res.status(500).json({ error: 'Error procesando el ingreso en la base de datos.' });
    } finally {
        clienteBD.release();
    }
}

/**
 * ENDPOINT 3: POST /api/garita/registrar-salida
 * Libera el espacio físico del parqueo y archiva/finaliza la reserva activa.
 */
async function registrarSalidaVehiculo(req, res) {
    const { id_espacio } = req.body;

    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN');

        // 1. Verificar que el espacio se encuentre actualmente registrado como OCUPADO
        const queryVerificarEspacio = `
            SELECT estado FROM espacios_estacionamiento WHERE id_espacio = $1 FOR UPDATE
        `;
        const resEspacio = await clienteBD.query(queryVerificarEspacio, [id_espacio]);

        if (resEspacio.rows.length === 0 || resEspacio.rows[0].estado !== 'OCUPADO') {
            await clienteBD.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'El espacio indicado no se encuentra ocupado o no existe en la sede Lima Centro.' 
            });
        }

        // 2. Cambiar el estado de la reserva del día asociada de 'COMPLETADA' a 'FINALIZADA'
        const queryFinalizarReserva = `
            UPDATE reservas 
            SET estado_reserva = 'FINALIZADA' 
            WHERE id_espacio = $1 AND fecha_reserva = CURRENT_DATE AND estado_reserva = 'COMPLETADA'
        `;
        await clienteBD.query(queryFinalizarReserva, [id_espacio]);

        // 3. Liberar el espacio físico volviéndolo a marcar como DISPONIBLE (Vuelve a verde en la Web)
        const queryLiberarEspacio = `
            UPDATE espacios_estacionamiento 
            SET estado = 'DISPONIBLE' 
            WHERE id_espacio = $1
        `;
        await clienteBD.query(queryLiberarEspacio, [id_espacio]);

        // Guardar cambios irrevocables
        await clienteBD.query('COMMIT');

        return res.status(200).json({ 
            mensaje: `Salida procesada con éxito. El espacio ${id_espacio} ya está disponible para nuevos alumnos.` 
        });

    } catch (error) {
        await clienteBD.query('ROLLBACK');
        console.error('Error al registrar salida en garita:', error);
        return res.status(500).json({ error: 'Error procesando la liberación del espacio de estacionamiento.' });
    } finally {
        clienteBD.release();
    }
}
// Exportamos todos Las funciones del controlador de reservas y operaciones de garita
module.exports = { 
    obtenerEspaciosGarita, 
    registrarIngresoVehiculo, 
    registrarSalidaVehiculo
};
