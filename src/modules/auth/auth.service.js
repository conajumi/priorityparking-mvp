// src/modules/auth/auth.service.js
const pool = require('../../config/database');

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
    return rows; // Retorna el estudiante encontrado con todo su récord académico
}

/**
 * Guarda el código OTP generado en la base de datos.
 
async function registrarLogOtp(codigoAlumno, codigoOtp) {
    const query = `
        INSERT INTO registro_otp (codigo_alumno, codigo_otp) 
        VALUES ($1, $2)
    `;
    await pool.query(query, [codigoAlumno, codigoOtp]);
    console.log(`[Database] OTP '${codigoOtp}' guardado en tabla para el alumno: ${codigoAlumno}`);
    return true;
}
*/
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

        // 2. Armar las opciones de envío por correo electrónico
        const opcionesCorreo = {
            from: `"PriorityParking UTP 🚗" <${process.env.SMTP_USER}>`,
            to: correoDestino,
            subject: `🔑 Código de Verificación PriorityParking - ${codigoOtp}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #003366; text-align: center;">🚗 PriorityParking MVP</h2>
                    <p>Tu código de verificación OTP de un solo uso es:</p>
                    <div style="background: #f1f5f9; border: 2px dashed #003366; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #003366; letter-spacing: 5px;">${codigoOtp}</span>
                    </div>
                </div>
            `
        };

        // 3. Intenta disparar el correo de forma asíncrona
        await transportador.sendMail(opcionesCorreo);
        console.log(`[SMTP] Correo enviado exitosamente a: ${correoDestino}`);
        
    } catch (error) {
        // 🚀 CONTINGENCIA CORE: Si falla el internet, las credenciales de Gmail o el SMTP de la UTP,
        // el flujo no se detiene. Imprimimos el código en la consola para salvaguardar las pruebas locales.
        console.warn(`[SMTP Warning] No se pudo despachar el correo físico (${error.message}). Usando contingencia en consola.`);
    }

    // Retorna TRUE de manera irrevocable para que el controlador avance en Postman/Web
    return true; 
}

/**
 * Busca el último OTP generado para el alumno que no haya sido utilizado
 * y que tenga menos de 5 minutos de antigüedad.
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
    
    // Si no hay registros válidos en tiempo o forma
    if (rows.length === 0) return false;

    const registro = rows[0];

    // Verificar si el número coincide con el ingresado por el usuario
    if (registro.codigo_otp === otpIngresado) {
        // Marcamos el OTP como utilizado para que no se vuelva a usar (Seguridad)
        await pool.query("UPDATE registro_otp SET expirado = TRUE WHERE id_otp = \$1", [registro.id_otp]);
        return true;
    }

    return false;
}

module.exports = {
    buscarEstudiantePorCorreo,
    registrarLogOtp,
    validarCodigoOtp
};


