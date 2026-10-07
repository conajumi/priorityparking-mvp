// src/modules/estacionales/espacios.controller.js
const espaciosService = require('./espacios.service');

/**
 * Obtener todos los espacios de estacionamiento filtrados opcionalmente por piso.
 * URL asociable: GET /api/garita/espacios
 */
async function listarEspacios(req, res) {
    // Captura el parámetro opcional de la URL (ej: /api/garita/espacios?piso=1)
    const { piso } = req.query; 

    try {
        let espacios;
        if (piso) {
            espacios = await espaciosService.obtenerEspaciosPorPiso(parseInt(piso));
        } else {
            espacios = await espaciosService.obtenerTodosLosEspacios();
        }
        
        return res.status(200).json(espacios);
    } catch (error) {
        console.error('[Espacios Controller Error]:', error.message);
        return res.status(500).json({ error: 'Error al consultar el mapa de estacionamientos.' });
    }
}

/**
 * Cambiar administrativamente el estado de un espacio (Ej: Bloquear por mantenimiento)
 */
async function actualizarEstadoEspacio(req, res) {
    const { id_espacio, nuevo_estado } = req.body;

    if (!id_espacio || !nuevo_estado) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (id_espacio, nuevo_estado).' });
    }

    try {
        const espacioActualizado = await espaciosService.modificarEstadoFisico(id_espacio, nuevo_estado);
        return res.status(200).json({
            mensaje: `El espacio ${id_espacio} fue actualizado a estado: ${nuevo_estado} con éxito.`,
            data: espacioActualizado
        });
    } catch (error) {
        console.error('[Espacios Controller Error]:', error.message);
        return res.status(500).json({ error: 'No se pudo actualizar el estado del espacio solicitado.' });
    }
}

module.exports = {
    listarEspacios,
    actualizarEstadoEspacio
};
