// src/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api.routes');

const app = express();

// Configuración del motor EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 1. Ruta Inicio / Mapa Alumno
app.get('/', (req, res) => {
    res.render('index', { 
        titulo: 'PriorityParking - Inicio',
        usuario: null 
    });
});

// 2. Ruta Login Alumnos
app.get('/login', (req, res) => {
    res.render('login', { 
        titulo: 'Iniciar Sesión - PriorityParking',
        error: null 
    });
});

// 3. Ruta Login Garita
app.get('/login-garita', (req, res) => {
    res.render('login-garita', { 
        titulo: 'Acceso Garita - PriorityParking' 
    });
});

// 4. Ruta Panel Monitor de Garita
app.get('/garita', (req, res) => {
    res.render('garita', { 
        titulo: 'Panel de Garita - PriorityParking' 
    });
});

// Endpoints Backend
app.use('/api', apiRoutes);

// Manejo 404
app.use((req, res) => {
    res.status(404).render('404', { 
        titulo: '404 No Encontrado',
        url: req.originalUrl 
    });
});

// Manejo de errores 500
app.use((err, req, res, next) => {
    console.error('[Error de Servidor]:', err.stack);
    if (req.originalUrl.startsWith('/api')) {
        return res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
    }
    res.status(500).send('Error interno en el servidor.');
});

module.exports = app;