// src/modules/auth/auth.controller.js
const jwt = require('jsonwebtoken'); // Importar JWT al inicio del archivo
const authService = require('./auth.service');

/**
 * PASO 1: Solicitar Código OTP (Con contingencia visual habilitada)
 */
async function solicitarOtp(req, res) { // 🚀 CORREGIDO: 'solicitarOtp' con O mayúscula
    const { correo } = req.body;

    try {
        const regexUtp = /^[a-zA-Z0-9._%+-]+@utp\.edu\.pe$/;
        if (!regexUtp.test(correo)) {
            return res.status(400).json({ 
                error: 'Acceso denegado. Debe ingresar un correo institucional válido de la UTP (@utp.edu.pe).' 
            });
        }

        // 1. Buscar filas en PostgreSQL
        const rows = await authService.buscarEstudiantePorCorreo(correo);
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({ 
                error: 'El estudiante no se encuentra registrado en el sistema institucional actual.' 
            });
        }

        //const estudiante = rows[0]; // Extraer el primer alumno de la lista blanca
         // 1. Buscar filas en PostgreSQL
        //const rows = await authService.buscarEstudiantePorCorreo(correo);
        /*
        if (!rows || rows.length === 0) {
            return res.status(404).json({ 
                error: 'El estudiante no se encuentra registrado en el sistema institucional actual.' 
            });
        }
         */
        // 🚀 CORRECCIÓN DE ORO: Agrega el para extraer al estudiante real del arreglo
        const estudiante = rows; 
        // 2. Evaluación detallada de las Reglas Académicas y Financieras
        if (!estudiante.es_apto_parking) {
            let motivosRechazo = [];
            
            if (!estudiante.esta_al_dia_pagos) {
                motivosRechazo.push("Presentas deudas pendientes en tus cuotas académicas.");
            }
            if (parseFloat(estudiante.porcentaje_asistencia) < 70.00) {
                motivosRechazo.push(`Tu asistencia actual es de ${estudiante.porcentaje_asistencia}%, siendo el mínimo requerido 70%.`);
            }
            if (parseFloat(estudiante.promedio_ponderado) < 14.00) {
                motivosRechazo.push(`Tu promedio ponderado es de ${estudiante.promedio_ponderado}, siendo la nota mínima requerida 14.00.`);
            }

            const mensajeFinalError = `Acceso Denegado PriorityParking: No cumples con los requisitos del día de hoy debido a: ${motivosRechazo.join(" y ")}`;

            return res.status(403).json({ error: mensajeFinalError });
        }

        // 3. Generar número aleatorio seguro de 6 dígitos
        const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 4. Registrar en la base de datos y despachar correo
        await authService.registrarLogOtp(estudiante.codigo_alumno, codigoOtp, correo);
        
        console.log(`\n📬 [Seguridad MVP] Código OTP generado para ${correo}: ${codigoOtp}\n`);

        // 5. ENVIAR RESPUESTA EXITOSA DE INMEDIATO PARA ACTIVAR LA CASILLA OTP EN LA WEB
        return res.status(200).json({ 
            mensaje: 'Código de verificación generado exitosamente. Revisa tu bandeja o la consola de desarrollo.',
            codigoAlumno: estudiante.codigo_alumno
        });

    } catch (error) {
        console.error('[Auth Controller Error Critical]:', error.message);
        return res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud de acceso.' });
    }
}


/**
 * PASO 2: Verificar Código OTP con Base de Datos y Generación Real de JWT
 */
async function verificarOtp(req, res) {
    const { codigoAlumno, otp } = req.body;

    // Validación de parámetros obligatorios de entrada
    if (!codigoAlumno || !otp) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (codigoAlumno, otp).' });
    }

    try {
        let esValido = false;
        let rolUsuario = 'ESTUDIANTE';
        // 1. Consulta real a la base de datos si el OTP es correcto y vigente en tiempo
        //const esValido = await authService.validarCodigoOtp(codigoAlumno, otp);

        // 🚀 ACCESO DIRECTO GARITA: Si es el operador de seguridad
        if (codigoAlumno === 'UTP-GARITA') {
            if (otp === 'GARITA2026') { // 🔑 Esta será la contraseña del vigilante
                esValido = true;
                rolUsuario = 'GARITA';
            }
        } else {
            // Flujo normal de Alumnos con base de datos
            esValido = await authService.validarCodigoOtp(codigoAlumno, otp);
        }

        if (!esValido) {
            return res.status(401).json({ error: 'El código OTP ingresado es incorrecto o ha expirado.' });
        }

        //console.log(`🔑 [Seguridad MVP] Acceso AUTORIZADO para el alumno ${codigoAlumno}.`);
        console.log(`🔑 [Seguridad MVP] Acceso AUTORIZADO para el rol: ${rolUsuario} (${codigoAlumno}).`);
        // 2. Definir el Rol asignado para la rúbrica del MVP (Alumnos por defecto)
        
        
        // Simulación de credenciales directas para accesos de control/maqueta
        if (codigoAlumno === 'UTP-GARITA') rolUsuario = 'GARITA';
        if (codigoAlumno === 'UTP-ADMIN') rolUsuario = 'ADMIN';
        
        

        // 3. Crear el Payload (Se corrigió la variable a 'codigoAlumno' para evitar el ReferenceError 🚀)
        const payload = {
            codigo: codigoAlumno,
            rol: rolUsuario,
            sede: 'LIMA_CENTRO'
        };

        // 4. Firmar y generar el Token JWT usando la librería instalada
        const claveSecreta = process.env.JWT_SECRET || 'FirmaSecretaPriorityParking2026';
        const tokenJwt = jwt.sign(payload, claveSecreta, { expiresIn: '2h' });

        // 5. RESPUESTA ÚNICA Y EXITOSA: Envía el mensaje, el Token y el Rol al Frontend
        return res.status(200).json({ 
            mensaje: 'Autenticación exitosa. Bienvenido a PriorityParking.',
            autorizado: true,
            token: tokenJwt,
            rol: rolUsuario
        });

    } catch (error) {
        console.error('[Auth Controller Error Real]:', error.message);
        return res.status(500).json({ error: 'Error interno del servidor al verificar el código de acceso.' });
    }
}


module.exports = { 
    solicitarOtp,
    verificarOtp
};
