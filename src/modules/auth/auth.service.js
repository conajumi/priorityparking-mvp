// src/modules/auth/auth.service.js
const pool = require('../../config/database');
const nodemailer = require('nodemailer'); 

// 🚀 CONFIGURACIÓN CORRECTA DEL TRANSPORTADOR SMTP
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
 * Busca un estudiante en la lista blanca optimizada por el ETL usando su correo.
 */
async function buscarEstudiantePorCorreo(correo) {
    const query = `
        SELECT codigo_alumno, nombre_completo, es_apto_parking,
               esta_al_dia_pagos, porcentaje_asistencia, promedio_ponderado
        FROM estudiantes_habilitados 
        WHERE correo_institucional = $1
    `;
    const { rows } = await pool.query(query, [correo]);
    return rows[0]; // Retorna la primera fila directamente
}

/**
 * Guarda el código OTP en la BD y dispara el correo real al alumno de la UTP.
 */
async function registrarLogOtp(codigoAlumno, codigoOtp, correoDestino) {
    try {
        // 1. Guardar obligatoriamente en la tabla de PostgreSQL en Docker
        const queryBD = `
            INSERT INTO registro_otp (codigo_alumno, codigo_otp) 
            VALUES ($1, $2)
        `;
        await pool.query(queryBD, [codigoAlumno, codigoOtp]);
        console.log(`[Database] OTP '${codigoOtp}' registrado para el alumno: ${codigoAlumno}`);

        // 2. Si las variables de correo están vacías en el .env, usamos consola de inmediato
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[SMTP Info] No hay credenciales configuradas en el .env. Usando respaldo en consola.`);
            return true;
        }

        // 3. Armar las opciones de envío por correo electrónico
        const opcionesCorreo = {
            from: `"PriorityParking UTP 🚗" <${process.env.SMTP_USER}>`,
            to: correoDestino,
            subject: `🔑 Código de Verificación PriorityParking - ${codigoOtp}`,
            html: `<h2>🚗 PriorityParking MVP</h2><p>Tu código OTP es: <strong>${codigoOtp}</strong></p>`
        };

        // 4. Intenta disparar el correo de forma asíncrona
        await transportador.sendMail(opcionesCorreo);
        console.log(`[SMTP] Correo enviado exitosamente a: ${correoDestino}`);
        
    } catch (error) {
        // 🚀 CONTINGENCIA REAL: Captura el error de 'transportador is not defined' o de red
        // e imprime el código sin congelar la ejecución del backend.
        console.warn(`[SMTP Warning] No se pudo despachar el correo físico (${error.message}). Usando contingencia en consola.`);
    }

    // Retorna TRUE de manera irrevocable para que el controlador avance siempre
    return true; 
}

/**
 * Busca el último OTP generado para el alumno que no haya expirado.
 */
async function validarCodigoOtp(codigoAlumno, otpIngresado) {
    const query = `
        SELECT id_otp, codigo_otp FROM registro_otp
        WHERE codigo_alumno = $1 
          AND expirado = FALSE
          AND fecha_generacion >= NOW() - INTERVAL '5 minutes'
        ORDER BY fecha_generacion DESC 
        LIMIT 1
    `;
    const { rows } = await pool.query(query, [codigoAlumno]);
    
    if (rows.length === 0) return false;

    const registro = rows[0];

    if (registro.codigo_otp === otpIngresado) {
        await pool.query("UPDATE registro_otp SET expirado = TRUE WHERE id_otp = \$1", [registro.id_otp]);
        return true;
    }
    return false;
}

/**
 * Verifica si un alumno cuenta con una sanción activa por inasistencia (No-Show)
 */
async function verificarEstudiantePenalizado(codigoAlumno) {
    const query = `
        SELECT id_penalizacion, motivo, fecha_fin 
        FROM historial_penalizaciones
        WHERE codigo_alumno = $1 
          AND activa = TRUE 
          AND fecha_fin >= NOW()
        LIMIT 1
    `;
    const { rows } = await pool.query(query, [codigoAlumno]);
    
    // Si encuentra una fila, significa que el alumno SÍ está penalizado
    if (rows.length > 0) {
        return {
            isPenalized: true,
            motivo: rows[0].motivo,
            fechaFin: rows[0].fecha_fin
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
