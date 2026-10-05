const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

/**
 * MOTOR ETL: Ejecutado automáticamente por un Job CRON cada madrugada a las 3:00 AM
 */
async function ejecutarEtlNocturno() {
    console.log('[ETL] Iniciando proceso de sincronización diaria a las 03:00 AM...');
    
    try {
        // 1. EXTRACT: Leer el archivo consolidado exportado por los sistemas centrales de la UTP
        const rutaArchivo = path.join(__dirname, '../../data/datos_utp_crudos.json');
        const dataCruda = await fs.readFile(rutaArchivo, 'utf-8');
        const estudiantesUpt = JSON.parse(dataCruda);

        console.log(`[ETL] Se han extraído ${estudiantesUpt.length} registros estudiantiles.`);

        // 2. TRANSFORM & LOAD: Procesar e inyectar en nuestra base de datos única
        for (const estudiante of estudiantesUpt) {
            
            // Aplicamos las reglas de negocio de manera estricta
            const estaAlDia = estudiante.deuda_pendiente === 0;
            const cumpleAsistencia = estudiante.porcentaje_asistencia >= 70.00;
            const cumplePromedio = estudiante.promedio_ponderado >= 14.00;

            // Inyección atómica con cláusula UPSERT (Si existe lo actualiza, si no lo inserta)
            const queryUpsert = `
                INSERT INTO estudiantes_habilitados 
                (codigo_alumno, correo_institucional, nombre_completo, esta_al_dia_pagos, porcentaje_asistencia, promedio_ponderado)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (codigo_alumno) 
                DO UPDATE SET 
                    esta_al_dia_pagos = EXCLUDED.esta_al_dia_pagos,
                    porcentaje_asistencia = EXCLUDED.porcentaje_asistencia,
                    promedio_ponderado = EXCLUDED.promedio_ponderado,
                    ultima_actualizacion_etl = CURRENT_TIMESTAMP;
            `;

            await pool.query(queryUpsert, [
                estudiante.codigo,
                `${estudiante.codigo}@utp.edu.pe`,
                estudiante.nombre,
                estaAlDia,
                estudiante.porcentaje_asistencia,
                estudiante.promedio_ponderado
            ]);
        }

        console.log('[ETL] Transformación y carga completada exitosamente. Lista blanca actualizada para Lima Centro.');

    } catch (error) {
        console.error('[ETL ERROR] Fallo crítico durante la sincronización nocturna:', error);
    }
}

module.exports = { ejecutarEtlNocturno };
