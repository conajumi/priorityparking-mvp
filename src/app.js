// src/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api.routes'); // Carga las rutas desde src/routes/

const app = express();

/**
 * MIDDLEWARES CENTRALES
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * INTERFAZ GRÁFICA PÚBLICA (FRONTEND)
 * Apunta directamente a src/public dentro de tu estructura de carpetas
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * INTERCONEXIÓN DE LAS APIS (BACKEND)
 */
app.use('/api', apiRoutes);

// Manejo central de errores
app.use((err, req, res, next) => {
    console.error('[Error de Servidor]:', err.stack);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor de PriorityParking.' });
});

module.exports = app; // Exporta el cerebro hacia server.js
