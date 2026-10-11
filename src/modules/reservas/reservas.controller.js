// src/modules/reservas/reservas.controller.js
const reservasService = require('./reservas.service'); 

/**
 * Registra el ingreso físico del vehículo por la puerta de control.
 * URL: POST /api/garita/registrar-ingreso
 */
async function registrarIngresoVehiculo(req, res) {
    const { codigo_alumno, id_espacio } = req.body;
    const fechaHoy = new Date().toISOString().split('T')[0]; // Fecha actual para control de acceso en garita

    try {
        const reserva = await reservasService.buscarReservaActiva(codigo_alumno, id_espacio, fechaHoy);
        
        if (!reserva) {
            return res.status(400).json({ 
                error: `No se localizó una reserva activa PENDIENTE para el alumno ${codigo_alumno} en el slot ${id_espacio} para el día de hoy (${fechaHoy}).` 
            });
        }
        // Ejecutar el bloque transaccional atómico  
        await reservasService.ejecutarIngresoTransaccional(reserva.id_reserva, id_espacio);

        console.log(`[Garita Control] Ingreso autorizado para alumno ${codigo_alumno} en slot ${id_espacio}.`);
        return res.status(200).json({ mensaje: `Ingreso validado con éxito. Slot ${id_espacio} ocupado.` });
        
    } catch (error) {
        console.error('[Reservas Controller Error]:', error.message);
        return res.status(500).json({ error: 'Fallo interno al procesar el ingreso vehicular.' });
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
    const { codigo_alumno, id_espacio, otp_verificado, fecha_reserva } = req.body;

    if (!codigo_alumno || !id_espacio || !otp_verificado || !fecha_reserva) {
        return res.status(400).json({ 
            error: 'Faltan parámetros obligatorios (codigo_alumno, id_espacio, otp_verificado, fecha_reserva).' 
        });
    }

    try {
        await reservasService.ejecutarReservaTransaccional(codigo_alumno, id_espacio, otp_verificado, fecha_reserva);
        
        return res.status(200).json({ 
            mensaje: `Reserva confirmada con éxito. El slot ${id_espacio} está separado para el día ${fecha_reserva}.`
        });
        
    } catch (error) {
        console.error('[Reservas Controller Error]:', error.message);
        if (error.message.includes('unique_reserva_por_dia_alumno') || error.code === '23505') {
            return res.status(400).json({ error: `Ya cuentas con una reserva registrada para el día ${fecha_reserva}.` });
        }
        return res.status(500).json({ error: 'Fallo interno al procesar el registro de tu reserva.' });
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
