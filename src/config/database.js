// src/config/database.js
const { Pool } = require('pg');

// Configuración del Pool utilizando las variables del archivo .env
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'utp_admin',
    password: process.env.DB_PASSWORD || 'SecretPasswordUTP2026',
    database: process.env.DB_DATABASE || 'priority_parking_mvp',
    max: 20,                          // Máximo 20 conexiones simultáneas
    idleTimeoutMillis: 30000,         // Cerrar conexiones inactivas tras 30 segundos
    connectionTimeoutMillis: 2000,    // Tiempo máximo de espera para conectar (2 segundos)
});

// Evento para monitorear conexiones exitosas en desarrollo
pool.on('connect', () => {
    console.log('[Base de Datos] Nueva conexión establecida con PostgreSQL de forma segura.');
});

// Evento para capturar errores inesperados en hilos de conexión de fondo
pool.on('error', (err) => {
    console.error('⚠️ [Base de Datos Error] Falla imprevista en el Pool de conexiones:', err);
});

module.exports = pool;
