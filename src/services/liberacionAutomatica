const pool = require('../config/database');

/**
 * Proceso que se ejecuta cada 5 minutos en el servidor para liberar slots expirados.
 * Si un alumno reservó para una hora específica y pasaron 20 minutos sin ingresar, se libera.
 */
async function liberarReservasExpiradas() {
    console.log('[Worker] Verificando tolerancia de reservas activas...');
    
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN');

        // 1. Buscar las reservas 'PENDIENTES' del día de hoy que hayan excedido los 20 minutos de tolerancia
        const queryExpiradas = `
            SELECT id_reserva, id_espacio 
            FROM reservas 
            WHERE fecha_reserva = CURRENT_DATE 
              AND estado_reserva = 'PENDIENTE'
              AND (hora_reserva + INTERVAL '20 minutes') < CURRENT_TIME
            FOR UPDATE;
        `;
        const { rows: reservasExpiradas } = await clienteBD.query(queryExpiradas);

        if (reservasExpiradas.length === 0) {
            await clienteBD.query('COMMIT');
            return;
        }

        for (const reserva of reservasExpiradas) {
            // 2. Cambiar el estado de la reserva a EXPIRADA
            await clienteBD.query(
                "UPDATE reservas SET estado_reserva = 'EXPIRADA' WHERE id_reserva = \$1",
                [reserva.id_reserva]
            );

            // 3. Devolver el espacio físico a estado DISPONIBLE (Vuelve a verde en el mapa)
            await clienteBD.query(
                "UPDATE espacios_estacionamiento SET estado = 'DISPONIBLE' WHERE id_espacio = \$1",
                [reserva.id_espacio]
            );

            console.log(`[Worker] Espacio ${reserva.id_espacio} liberado automáticamente por tardanza del alumno.`);
        }

        await clienteBD.query('COMMIT');
    } catch (error) {
        await clienteBD.query('ROLLBACK');
        console.error('[Worker Error] Fallo al liberar estacionamientos expirados:', error);
    } finally {
        clienteBD.release();
    }
}

module.exports = { liberarReservasExpiradas };
