const pool = require('../../config/database');
// En producción, se importaría la configuración de nodemailer
// const transporer = require('../../config/mailer'); 

/**
 * PASO 1: Solicitar Código OTP
 * Valida el correo, verifica las reglas de negocio del ETL y envía el token.
 */
async function solicitarOtp(req, res) {
    const { correo } = req.body;

    try {
        // 1. Validación estricta del dominio institucional de la UTP
        const regexUtp = /^[a-zA-Z0-9._%+-]+@utp\.edu\.pe\$/;
        if (!regexUtp.test(correo)) {
            return res.status(400).json({ 
                error: 'Acceso denegado. Debe ingresar un correo institucional válido de la UTP (@utp.edu.pe).' 
            });
        }

        // 2. Consulta rápida a la base de datos única (Data optimizada por el ETL)
        const queryEstudiante = `
            SELECT codigo_alumno, nombre_completo, es_apto_parking 
            FROM estudiantes_habilitados 
            WHERE correo_institucional = $1
        `;
        const resultadoEstudiante = await pool.query(queryEstudiante, [correo]);

        if (resultadoEstudiante.rows.length === 0) {
            return res.status(404).json({ 
                error: 'El estudiante no se encuentra registrado en el sistema institucional actual.' 
            });
        }

        const estudiante = resultadoEstudiante.rows[0];

        // 3. Evaluar de inmediato el resultado de las 3 Reglas de Negocio (Pagos, Asistencias, Promedio)
        if (!estudiante.es_apto_parking) {
            return res.status(403).json({ 
                error: 'Lo sentimos. No cumples con los requisitos de PriorityParking para el día de hoy (Revisar récord de pagos, asistencias o promedio).' 
            });
        }

        // 4. Generación de código temporal OTP de 6 dígitos
        const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardamos el OTP temporalmente en la base de datos (En un MVP, podemos usar una tabla temporal o la de reservas)
        // Para este ejemplo de flujo, guardamos el log y simulamos el envío de correo seguro
        console.log(`[Seguridad MVP] Código OTP generado para ${correo}: ${codigoOtp}`);
        
        /* 
        // Implementación futura del envío de correo real:
        await transporter.sendMail({
            from: '"PriorityParking UTP" <parking@utp.edu.pe>',
            to: correo,
            subject: "Tu Código de Acceso - PriorityParking",
            text: `Hola ${estudiante.nombre_completo}, tu código de verificación es: ${codigoOtp}. Expira en 10 minutos.`
        });
        */

        // Devolvemos éxito al cliente web/móvil (nunca enviamos el OTP en el JSON por seguridad)
        return res.status(200).json({ 
            mensaje: 'Código de verificación enviado exitosamente a tu correo de la UTP.',
            codigoAlumno: estudiante.codigo_alumno
        });

    } catch (error) {
        console.error('Error en solicitarOtp:', error);
        return res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.' });
    }
}

/**
 * PASO 2: Verificar Código OTP
 * Comprueba si los 6 dígitos ingresados por el alumno corresponden al token temporal generado.
 */
async function verificarOtp(req, res) {
    const { codigo_alumno, codigo_otp } = req.body;

    try {
        // En un flujo MVP, validamos contra la tabla de reservas o log temporales.
        // Aquí verificamos que exista una reserva pendiente con ese código para el día de hoy.
        const queryValidar = `
            SELECT id_reserva, id_espacio 
            FROM reservas 
            WHERE codigo_alumno = $1 
              AND codigo_otp_usado = $2 
              AND fecha_reserva = CURRENT_DATE 
              AND estado_reserva = 'PENDIENTE'
        `;
        const resultado = await pool.query(queryValidar, [codigo_alumno, codigo_otp]);

        if (resultado.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Código de verificación incorrecto, expirado o inexistente. Intente nuevamente.' 
            });
        }

        // Si el código es correcto, el backend confirma el acceso del alumno
        return res.status(200).json({ 
            mensaje: 'Autenticación exitosa. Acceso concedido al mapa de estacionamientos.',
            espacioReservado: resultado.rows[0].id_espacio
        });

    } catch (error) {
        console.error('Error en verificarOtp:', error);
        return res.status(500).json({ error: 'Error interno al validar el código OTP.' });
    }
}

// Recuerda actualizar tus exports al final del archivo:
module.exports = { solicitarOtp, verificarOtp };

