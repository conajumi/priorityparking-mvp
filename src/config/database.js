// src/config/database.js
const { Pool } = require('pg');

// Si existe DATABASE_URL (Railway o producción), la usa directamente con SSL.
// Si no, toma las variables individuales como fallback para desarrollo local.
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        user: process.env.DB_USER || 'utp_admin',
        password: process.env.DB_PASSWORD || 'SecretPasswordUTP2026',
        database: process.env.DB_DATABASE || 'priority_parking_mvp'
    };

const pool = new Pool({
    ...poolConfig,
    max: 20,                          // Máximo 20 conexiones concurrentes
    idleTimeoutMillis: 30000,         // Cerrar conexiones inactivas tras 30s
    connectionTimeoutMillis: 5000     // Margen de 5s para conexiones remotas
});

// Evento para monitorear conexiones exitosas
pool.on('connect', () => {
    console.log('[Base de Datos] Conexión establecida con PostgreSQL (Railway/Local).');
});

// Evento para registrar errores de conexión de fondo
pool.on('error', (err) => {
    console.error('⚠️ [Base de Datos Error] Falla en el Pool de conexiones:', err.message);
});

module.exports = pool;