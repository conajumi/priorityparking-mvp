// src/config/mailer.js
const nodemailer = require('nodemailer');

// Configuración del transportador de correos
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io', // Cambiar por el SMTP de la UTP en producción
    port: process.env.MAIL_PORT || 2525,
    auth: {
        user: process.env.MAIL_USER || 'tu_usuario_prueba',
        password: process.env.MAIL_PASSWORD || 'tu_contraseña_prueba'
    }
});

// Verificar la conexión con el servidor de correos al arrancar
transporter.verify((error, success) => {
    if (error) {
        console.error('⚠️ [Mailer Error] No se pudo establecer conexión con el servidor SMTP:', error.message);
    } else {
        console.log('[Mailer] Servidor de correos listo para despachar códigos OTP.');
    }
});

module.exports = transporter;
