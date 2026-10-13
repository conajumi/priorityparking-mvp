// src/jobs/tolerance.job.js
const cron = require('node-cron');
const pool = require('../config/database');

function iniciarVerificadorTolerancia() {
    // Se ejecuta cada minuto (* * * * *) para máxima precisión del MVP
    cron.schedule('* * * * *', async () => {
        const clienteBD = await pool.connect();
        try {
            await clienteBD.query('BEGIN');

            // Localizar reservas pendientes de hoy que ya superaron los 20 minutos de tolerancia
            const query = `
                SELECT id_reserva, id_espacio, codigo_alumno 
                FROM reservas
                WHERE fecha_reserva = CURRENT_DATE 
                  AND estado_reserva = 'PENDIENTE'
                  AND (hora_llegada_programada + INTERVAL '20 minutes') < CURRENT_TIME
                FOR UPDATE
            `;
            const { rows } = await clienteBD.query(query);

            for (const reserva of rows) {
                // 1. Expirar la reserva
                await clienteBD.query("UPDATE reservas SET estado_reserva = 'EXPIRADA' WHERE id_reserva = \$1", [reserva.id_reserva]);
                // 2. Liberar el slot físico instantáneamente para la comunidad UTP
                await clienteBD.query("UPDATE espacios_estacionamiento SET estado = 'DISPONIBLE' WHERE id_espacio = \$1", [reserva.id_espacio]);
                // 3. Aplicar sanción automatizada
                const fechaFin = new Date();
                fechaFin.setDate(fechaFin.getDate() + 3);
                await clienteBD.query(
                    "INSERT INTO historial_penalizaciones (codigo_alumno, motivo, fecha_fin) VALUES (\$1, 'Inasistencia automática: Tolerancia de 20 min vencida.', \$2)",
                    [reserva.codigo_alumno, fechaFin]
                );
                console.warn(`🚨 [Tolerancia Alertas] Alumno ${reserva.codigo_alumno} penalizado. Slot ${reserva.id_espacio} liberado automáticamente.`);
            }
            await clienteBD.query('COMMIT');
        } catch (error) {
            await clienteBD.query('ROLLBACK');
            console.error('Error en Cron de Tolerancia:', error.message);
        } finally {
            clienteBD.release();
        }
    });
}
