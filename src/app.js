// src/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api.routes');

const app = express();

// Configuración del motor EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// RUTAS DE VISTAS (FRONTEND)
// -------------------------------------------------------------

// 1. Redirección inicial hacia el Dashboard del Estudiante
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// 2. Ruta E02: Dashboard del Estudiante (Mockup Figma)
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { 
        titulo: 'Dashboard del Estudiante - ParkingU' 
    });
});

// 3. Ruta Selección de Espacios y Reserva en Tiempo Real
app.get('/reserva', (req, res) => {
    res.render('reserva', { 
        titulo: 'Reserva tu Espacio - PriorityParking',
        usuario: null 
    });
});

// 4. Ruta Login Alumnos (Correo institucional y validación OTP)
app.get('/login', (req, res) => {
    res.render('login', { 
        titulo: 'Iniciar Sesión - PriorityParking',
        error: null 
    });
});

// 5. Ruta Login Garita (Vigilancia)
app.get('/login-garita', (req, res) => {
    res.render('login-garita', { 
        titulo: 'Acceso Garita - PriorityParking' 
    });
});

// 6. Ruta Panel Monitor de Garita
app.get('/garita', (req, res) => {
    res.render('garita', { 
        titulo: 'Panel de Garita - PriorityParking' 
    });
});

app.get('/mis-reservas', (req, res) => {
    res.render('mis-reservas', { titulo: 'Mis Reservas - ParkingU' });
});

app.get('/prioridad', (req, res) => {
    res.render('prioridad', { titulo: 'Mi Prioridad - ParkingU' });
});

app.get('/historial', (req, res) => {
    res.render('historial', { titulo: 'Historial y Penalidades - ParkingU' });
});
// -------------------------------------------------------------
// RUTAS DE LA API Y MANEJO DE ERRORES
// -------------------------------------------------------------

// Endpoints Backend
app.use('/api', apiRoutes);

// Manejo de error 404
app.use((req, res) => {
    res.status(404).render('404', { 
        titulo: '404 No Encontrado',
        url: req.originalUrl 
    });
});

// Manejo de errores internos 500
app.use((err, req, res, next) => {
    console.error('[Error de Servidor]:', err.stack);
    if (req.originalUrl.startsWith('/api')) {
        return res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
    }
    res.status(500).send('Error interno en el servidor.');
});

module.exports = app;