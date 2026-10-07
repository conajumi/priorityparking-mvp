// src/modules/auth/auth.controller.js
const authService = require('./auth.service');

/**
 * PASO 1: Solicitar Código OTP
 */
/**
 * PASO 1: Solicitar Código OTP (Con contingencia visual habilitada)
 */
async function solicitarOtp(req, res) {
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

        const estudiante = rows[0]; // Extraer el primer alumno de la lista blanca

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
        
        // 4. Registrar en la base de datos y despachar correo (Si Nodemailer falla, no tira error 500)
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
 * PASO 2: Verificar Código OTP (Caso Real)
 */
async function verificarOtp(req, res) {
    const { codigoAlumno, otp } = req.body;

    if (!codigoAlumno || !otp) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (codigoAlumno, otp).' });
    }

    try {
        // Consulta a la base de datos si el OTP es correcto y vigente
        const esValido = await authService.validarCodigoOtp(codigoAlumno, otp);

        if (!esValido) {
            return res.status(401).json({ error: 'El código OTP ingresado es incorrecto o ha expirado.' });
        }

        console.log(`🔑 [Seguridad MVP] Acceso AUTORIZADO para el alumno ${codigoAlumno}.`);
        
        return res.status(200).json({ 
            mensaje: 'Autenticación exitosa. Bienvenido a PriorityParking.',
            autorizado: true
        });

    } catch (error) {
        console.error('[Auth Controller Error]:', error.message);
        return res.status(500).json({ error: 'Error interno al verificar el código de acceso.' });
    }
}

module.exports = { 
    solicitarOtp,
    verificarOtp
};
