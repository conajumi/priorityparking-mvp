// 1. Cargar variables de entorno del archivo .env (Seguridad para producción)
require('dotenv').config();

const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api.routes');

const app = express();
// Definir el puerto del servidor (usa el puerto 3000 por defecto en desarrollo)
const PORT = process.env.PORT || 3000;

/**
 * ==========================================
 * MIDDLEWARES CENTRALES
 * ==========================================
 */
// Permite al backend entender y procesar datos enviados en formato JSON (Como el que mandamos desde Postman)
app.use(express.json());

// Permite procesar formularios web tradicionales
app.use(express.urlencoded({ extended: true }));

/**
 * ==========================================
 * RUTA DE INTERFAZ GRÁFICA (FRONTEND)
 * ==========================================
 */
// Sirve de forma automática tu Mockup HTML/CSS/JS interactivo ubicado en la carpeta public
app.use(express.static(path.join(__dirname, 'src/public')));

/**
 * ==========================================
 * INTERCONEXIÓN DE LAS APIS (BACKEND)
 * ==========================================
 */
// Conecta todas las rutas programadas (Auth, Espacios, Garita) bajo el prefijo universal /api
app.use('/api', apiRoutes);

/**
 * ==========================================
 * MANEJO CENTRAL DE ERRORES (MIDDLEWARE DE SEGURIDAD)
 * ==========================================
 */
app.use((err, req, res, next) => {
    console.error('[Error de Servidor]:', err.stack);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor de PriorityParking.' });
});

/**
 * ==========================================
 * ENCENDIDO DEL SERVIDOR
 * ==========================================
 */
app.listen(PORT, () => {
    console.log(`\n🚗 ==================================================== 🚗`);
    console.log(`   PriorityParking MVP - Sede Lima Centro Activa`);
    console.log(`   Servidor ejecutándose exitosamente en el puerto: ${PORT}`);
    console.log(`   Pruebas locales disponibles en: http://localhost:${PORT}`);
    console.log(`🚗 ==================================================== 🚗\n`);
});

module.exports = app; // Exportamos la app para facilitar futuras pruebas automatizadas
