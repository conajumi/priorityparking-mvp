// src/modules/estacionales/espacios.service.js
const pool = require('../../config/database');

/**
 * Consulta en la base de datos la lista completa de slots de Lima Centro.
 */
async function obtenerTodosLosEspacios() {
    const query = `
        SELECT id_espacio, piso, numero_slot, estado, tipo_vehiculo 
        FROM espacios_estacionamiento 
        ORDER BY piso ASC, numero_slot ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
}

/**
 * Filtra los espacios específicos de un piso determinado.
 */
async function obtenerEspaciosPorPiso(piso) {
    const query = `
        SELECT id_espacio, piso, numero_slot, estado, tipo_vehiculo 
        FROM espacios_estacionamiento 
        WHERE piso = $1
        ORDER BY numero_slot ASC
    `;
    const { rows } = await pool.query(query, [piso]);
    return rows;
}

/**
 * Modifica el estado de un slot en la base de datos (Ej: De DISPONIBLE a MANTENIMIENTO)
 */
async function modificarEstadoFisico(idEspacio, nuevoEstado) {
    const query = `
        UPDATE espacios_estacionamiento 
        SET estado = $2 
        WHERE id_espacio = $1
        RETURNING *
    `;
    const { rows } = await pool.query(query, [idEspacio, nuevoEstado.toUpperCase()]);
    
    if (rows.length === 0) {
        throw new Error(`El espacio con ID ${idEspacio} no existe en la sede.`);
    }
    
    return rows[0];
}

module.exports = {
    obtenerTodosLosEspacios,
    obtenerEspaciosPorPiso,
    modificarEstadoFisico
};
