// src/routes/api.routes.js
const express = require('express');
const router = express.Router();
const { verificarRol } = require('../middlewares/auth.middleware');

// Importar controladores
const authController = require('../modules/auth/auth.controller');
const espaciosController = require('../modules/estacionales/espacios.controller');
const reservasController = require('../modules/reservas/reservas.controller');

/**
 * ==========================================
 * RUTAS PÚBLICAS: AUTENTICACIÓN
 * ==========================================
 */
// Alumno solicita el código OTP con su correo institucional
router.post('/auth/solicitar-otp', authController.solicitarOtp);

// Validación del código OTP de 6 dígitos
router.post('/auth/verificar-otp', authController.verificarOtp);

/**
 * =================================================================
 * RUTAS PROTEGIDAS CON AUTENTICACIÓN JWT Y CONTROL DE ROLES
 * =================================================================
 */

// 1. Obtener el mapa de espacios en tiempo real (Estudiantes, Garita y Admin)
router.get('/garita/espacios', verificarRol(['ESTUDIANTE', 'GARITA', 'ADMIN']), reservasController.obtenerEspaciosGarita);

// 2. Registrar el ingreso vehicular (Exclusivo Vigilante/Admin)
router.post('/garita/registrar-ingreso', verificarRol(['GARITA', 'ADMIN']), reservasController.registrarIngresoVehiculo);

// 3. Registrar la salida y liberar el espacio (Exclusivo Vigilante/Admin)
router.post('/garita/registrar-salida', verificarRol(['GARITA', 'ADMIN']), reservasController.registrarSalidaVehiculo);

// 4. Crear una nueva reserva de slot (Exclusivo Estudiantes)
router.post('/reservas/crear', verificarRol(['ESTUDIANTE']), reservasController.crearReservaAlumno);

// 5. Cancelar una reserva activa voluntariamente (Exclusivo Estudiantes)
router.post('/reservas/cancelar', verificarRol(['ESTUDIANTE']), reservasController.cancelarReservaAlumno);

// 6. Consultar reservas del estudiante (Pantalla E06 - Mis Reservas)
router.get('/reservas/mis-reservas', verificarRol(['ESTUDIANTE', 'ADMIN']), reservasController.listarMisReservas);

module.exports = router;