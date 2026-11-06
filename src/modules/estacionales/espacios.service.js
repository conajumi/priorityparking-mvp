// src/modules/estacionales/espacios.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Consulta en la base de datos la lista completa de slots de Lima Centro.
 */
async function obtenerTodosLosEspacios() {
    const espacios = await prisma.espacioEstacionamiento.findMany({
        select: {
            idEspacio: true,
            piso: true,
            numeroSlot: true,
            estado: true,
            tipoVehiculo: true
        },
        orderBy: [
            { piso: 'asc' },
            { numeroSlot: 'asc' }
        ]
    });

    // Mapeo para que el frontend mantenga los nombres snake_case de las propiedades
    return espacios.map(e => ({
        id_espacio: e.idEspacio,
        piso: e.piso,
        numero_slot: e.numeroSlot,
        estado: e.estado,
        tipo_vehiculo: e.tipoVehiculo
    }));
}

/**
 * Filtra los espacios específicos de un piso determinado.
 */
async function obtenerEspaciosPorPiso(piso) {
    const espacios = await prisma.espacioEstacionamiento.findMany({
        where: {
            piso: parseInt(piso, 10)
        },
        select: {
            idEspacio: true,
            piso: true,
            numeroSlot: true,
            estado: true,
            tipoVehiculo: true
        },
        orderBy: {
            numeroSlot: 'asc'
        }
    });

    return espacios.map(e => ({
        id_espacio: e.idEspacio,
        piso: e.piso,
        numero_slot: e.numeroSlot,
        estado: e.estado,
        tipo_vehiculo: e.tipoVehiculo
    }));
}

/**
 * Modifica el estado de un slot en la base de datos (Ej: De DISPONIBLE a MANTENIMIENTO)
 */
async function modificarEstadoFisico(idEspacio, nuevoEstado) {
    const actualizado = await prisma.espacioEstacionamiento.update({
        where: {
            idEspacio: idEspacio
        },
        data: {
            estado: nuevoEstado.toUpperCase()
        }
    });

    return {
        id_espacio: actualizado.idEspacio,
        piso: actualizado.piso,
        numero_slot: actualizado.numeroSlot,
        estado: actualizado.estado,
        tipo_vehiculo: actualizado.tipoVehiculo
    };
}

module.exports = {
    obtenerTodosLosEspacios,
    obtenerEspaciosPorPiso,
    modificarEstadoFisico
};