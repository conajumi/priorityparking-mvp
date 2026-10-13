// src/modules/reservas/reservas.controller.js
//const reservasService = require('./reservas.service'); 
// 🚀 AGREGA ESTA LÍNEA EN LA LÍNEA 1 DE RESERVAS.CONTROLLER.JS:
const pool = require('../../config/database'); 
const reservasService = require('./reservas.service');

/**
 * Validar Ingreso en Garita controlando los 20 minutos de tolerancia estricta
 * URL: POST /api/garita/registrar-ingreso
 */
/**
 * Validar Ingreso en Garita controlando los 20 minutos de tolerancia estricta
 * URL: POST /api/garita/registrar-ingreso
 */
async function registrarIngresoVehiculo(req, res) {
    const codigoAlumnoLimpio = req.body.codigo_alumno || req.body.codigoAlumno;
    const idEspacioLimpio = req.body.id_espacio || req.body.idEspacio;

    if (!codigoAlumnoLimpio || !idEspacioLimpio) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (codigo_alumno, id_espacio).' });
    }

    const parametroAlumno = String(codigoAlumnoLimpio).trim();
    const parametroEspacio = String(idEspacioLimpio).trim();
    // Fecha de hoy en Lima, formato YYYY-MM-DD
    const parametroFecha = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    console.log(`[Garita] Buscando reserva: Alumno=${parametroAlumno}, Slot=${parametroEspacio}, Fecha=${parametroFecha}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Buscar y bloquear la reserva. La tolerancia (+20 min) se calcula en Lima dentro de SQL.
        const { rows } = await client.query(
            `SELECT id_reserva,
                    hora_llegada_programada::text AS hora_text,
                    ((now() AT TIME ZONE 'America/Lima')::time
                        > hora_llegada_programada + interval '20 minutes') AS vencida
             FROM reservas
             WHERE codigo_alumno = $1
               AND id_espacio = $2
               AND fecha_reserva = $3::date
               AND estado_reserva = 'PENDIENTE'
             FOR UPDATE`,
            [parametroAlumno, parametroEspacio, parametroFecha]
        );

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `No se localizó una reserva PENDIENTE para el alumno ${parametroAlumno} en el slot ${parametroEspacio} para hoy (${parametroFecha}).`
            });
        }

        const { id_reserva: idReserva, hora_text: horaProgramada, vencida } = rows[0];

        // 2. Tolerancia vencida: expirar, liberar espacio y penalizar
        if (vencida) {
            await client.query(
                `UPDATE reservas SET estado_reserva = 'EXPIRADA' WHERE id_reserva = $1`,
                [idReserva]
            );
            await client.query(
                `UPDATE espacios_estacionamiento SET estado = 'DISPONIBLE' WHERE id_espacio = $1`,
                [parametroEspacio]
            );
            await client.query(
                `INSERT INTO historial_penalizaciones (codigo_alumno, motivo, fecha_fin)
                 VALUES ($1, $2, now() + interval '3 days')`,
                [parametroAlumno, 'Excedió los 20 minutos de tolerancia en garita.']
            );
            await client.query('COMMIT');

            return res.status(403).json({
                error: `Acceso denegado: excediste los 20 minutos de tolerancia (hora programada: ${horaProgramada}). El espacio fue liberado.`
            });
        }

        // 3. A tiempo: reserva -> COMPLETADA y espacio -> OCUPADO
        await client.query(
            `UPDATE reservas SET estado_reserva = 'COMPLETADA' WHERE id_reserva = $1`,
            [idReserva]
        );

        const upd = await client.query(
            `UPDATE espacios_estacionamiento SET estado = 'OCUPADO'
             WHERE id_espacio = $1 AND estado = 'RESERVADO'`,
            [parametroEspacio]
        );
        if (upd.rowCount === 0) {
            throw new Error(`El espacio ${parametroEspacio} no estaba en estado RESERVADO`);
        }

        await client.query('COMMIT');

        console.log(`[Garita] Ingreso autorizado: alumno ${parametroAlumno}, slot ${parametroEspacio}.`);
        return res.status(200).json({
            mensaje: `Ingreso validado con éxito. El slot ${parametroEspacio} ahora está OCUPADO.`
        });

    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Garita] ERROR REAL:', error.message,
            '\nDetalle:', error.detail,
            '\nConstraint:', error.constraint,
            '\nStack:', error.stack);
        return res.status(500).json({ error: 'Fallo interno al procesar el ingreso vehicular en garita.' });
    } finally {
        client.release();
    }
}

/**
 * Registra la salida del vehículo liberando el slot para el mapa web.
 * URL: POST /api/garita/registrar-salida
 */
async function registrarSalidaVehiculo(req, res) {
    const { id_espacio } = req.body;

    if (!id_espacio) {
        return res.status(400).json({ error: 'Falta el parámetro requerido (id_espacio).' });
    }

    try {
        await reservasService.ejecutarSalidaTransaccional(id_espacio);
        
        console.log(`[Garita Control] Espacio ${id_espacio} liberado y disponible en red.`);
        return res.status(200).json({ mensaje: `Salida procesada. Espacio ${id_espacio} liberado de inmediato.` });
        
    } catch (error) {
        console.error('[Reservas Controller Error]:', error.message);
        return res.status(500).json({ error: 'Fallo interno al procesar la salida vehicular en garita.' });
    }
}

/**
 * Obtiene el mapa de espacios en tiempo real.
 * URL: GET /api/garita/espacios
 */
async function obtenerEspaciosGarita(req, res) {
    try {
        const espacios = await reservasService.obtenerTodosLosEspacios(); 
        return res.status(200).json(espacios);
    } catch (error) {
        console.error('[Reservas Controller Error]:', error.message);
        return res.status(500).json({ error: 'Fallo interno al obtener el mapa de espacios.' });
    }
}

/**
 * Procesa la solicitud del alumno para reservar un slot del mapa eligiendo su fecha de llegada.
 * URL: POST /api/reservas/crear
 */
async function crearReservaAlumno(req, res) {
    const { codigo_alumno, id_espacio, otp_verificado, fecha_reserva, hora_llegada } = req.body;

    if (!codigo_alumno || !id_espacio || !otp_verificado || !fecha_reserva || !hora_llegada) {
        return res.status(400).json({ 
            error: 'Faltan parámetros obligatorios (codigo_alumno, id_espacio, otp_verificado, fecha_reserva, hora_llegada).' 
        });
    }

    try {
        await reservasService.ejecutarReservaTransaccional(codigo_alumno, id_espacio, otp_verificado, fecha_reserva, hora_llegada);
        
        return res.status(200).json({ 
            mensaje: `Reserva confirmada. El slot ${id_espacio} está separado para el día ${fecha_reserva} a las ${hora_llegada}). Tienes 20 min de tolerancia.`
        });
        
    } catch (error) {
        console.error('[Reservas Controller Error]:', error.message);
        if (error.message.includes('unique_reserva_por_dia_alumno') || error.code === '23505') {
            return res.status(400).json({ error: `Ya cuentas con una reserva registrada para el día ${fecha_reserva}.` });
        }
        //return res.status(500).json({ error: 'Fallo interno al procesar el registro de tu reserva.' });
        return res.status(500).json({ error: error.message || 'Fallo interno al procesar la reserva.' });
    }
}

/**
 * Permite al alumno cancelar de forma voluntaria su reserva pactada.
 * URL: POST /api/reservas/cancelar
 */
async function cancelarReservaAlumno(req, res) {
    const { codigo_alumno, fecha_reserva } = req.body;

    if (!codigo_alumno || !fecha_reserva) {
        return res.status(400).json({ error: 'Faltan parámetros obligatorios (codigo_alumno, fecha_reserva).' });
    }

    try {
        await reservasService.ejecutarCancelacionTransaccional(codigo_alumno, fecha_reserva);
        
        return res.status(200).json({ 
            mensaje: `Reserva para el día ${fecha_reserva} cancelada con éxito. El espacio ha sido liberado para la comunidad.` 
        });
    } catch (error) {
        console.error('[Cancelación Controller Error]:', error.message);
        return res.status(500).json({ error: error.message || 'Fallo interno al procesar la cancelación.' });
    }
}



module.exports = {
    registrarIngresoVehiculo,
    registrarSalidaVehiculo,
    obtenerEspaciosGarita,
    crearReservaAlumno,
    cancelarReservaAlumno
};
