// src/modules/auth/auth.service.js
//const pool = require('../../config/database');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

// Inicialización segura del cliente de Prisma ORM
const prisma = new PrismaClient();

// CONFIGURACIÓN DEL TRANSPORTADOR SMTP
const transportador = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '://gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, 
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

/**
 * Busca un estudiante usando su correo.
 */
async function buscarEstudiantePorCorreo(correo) {
    return await prisma.estudianteHabilitado.findUnique({
        where: {
            correoInstitucional: correo
        }
    });
}

/**
 * Guarda el código OTP en la BD y dispara el correo real al alumno.
 */
async function registrarLogOtp(codigoAlumno, codigoOtp, correoDestino) {
    try {
        await prisma.registroOtp.create({
            data: {
                codigoAlumno: codigoAlumno,
                codigoOtp: codigoOtp,
                expirado: false
            }
        });
        console.log(`[Database] OTP '${codigoOtp}' registrado para el alumno: ${codigoAlumno}`);

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[SMTP Info] No hay credenciales configuradas en el .env. Usando respaldo en consola.`);
            return true;
        }

        const opcionesCorreo = {
            from: `"PriorityParking UTP 🚗" <${process.env.SMTP_USER}>`,
            to: correoDestino,
            subject: `🔑 Código de Verificación PriorityParking - ${codigoOtp}`,
            html: `<h2>🚗 PriorityParking MVP</h2><p>Tu código OTP es: <strong>${codigoOtp}</strong></p>`
        };

        await transportador.sendMail(opcionesCorreo);
        console.log(`[SMTP] Correo enviado exitosamente a: ${correoDestino}`);
        
    } catch (error) {
        console.warn(`[SMTP Warning] No se pudo despachar el correo físico (${error.message}). Usando contingencia en consola.`);
    }

    return true; 
}

/**
 * Busca el último OTP generado para el alumno que no haya expirado.
 */
async function validarCodigoOtp(codigoAlumno, otpIngresado) {
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);

    const registro = await prisma.registroOtp.findFirst({
        where: {
            codigoAlumno: codigoAlumno,
            expirado: false,
            fechaGeneracion: {
                gte: cincoMinutosAtras
            }
        },
        orderBy: {
            fechaGeneracion: 'desc'
        }
    });
    
    if (!registro) return false;

    if (registro.codigoOtp === otpIngresado) {
        await prisma.registroOtp.update({
            where: {
                idOtp: registro.idOtp
            },
            data: {
                expirado: true
            }
        });
        return true;
    }
    return false;
}

/**
 * Verifica si un alumno cuenta con una sanción activa
 */
async function verificarEstudiantePenalizado(codigoAlumno) {
    const penalizacion = await prisma.historialPenalizacion.findFirst({
        where: {
            codigoAlumno: codigoAlumno,
            activa: true,
            fechaFin: {
                gte: new Date()
            }
        }
    });
    
    if (penalizacion) {
        return {
            isPenalized: true,
            motivo: penalizacion.motivo,
            fechaFin: penalizacion.fechaFin
        };
    }
    
    return { isPenalized: false };
}

module.exports = {
    buscarEstudiantePorCorreo,
    registrarLogOtp,
    validarCodigoOtp,
    verificarEstudiantePenalizado
};
