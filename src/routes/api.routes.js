const express = require('express');
const router = express.Router();

// Importar los controladores desarrollados
const authController = require('../modules/auth/auth.controller');
const reservasController = require('../modules/reservas/reservas.controller');

/**
 * ==========================================
 * RUTAS DEL MÓDULO 1: AUTENTICACIÓN
 * ==========================================
 */
// Alumno solicita el código OTP ingresando su correo institucional
router.post('/auth/solicitar-otp', authController.solicitarOtp);


/**
 * ==========================================
 * RUTAS DEL MÓDULO 2 Y 3: OPERACIONES DE GARITA Y MAPA
 * ==========================================
 */
// Obtener el mapa de espacios en tiempo real (Usado por Alumnos y el Monitor de Garita)
router.get('/garita/espacios', reservasController.obtenerEspaciosGarita);

// Registrar el ingreso físico del vehículo (Vigilante presiona "Ingresar" en su panel)
router.post('/garita/registrar-ingreso', reservasController.registrarIngresoVehiculo);

// Registrar la salida y liberar el espacio (Vigilante presiona "Liberar" al salir el auto)
router.post('/garita/registrar-salida', reservasController.registrarSalidaVehiculo);

// Verificacion de codigo OTP, cuando se inicia sesion con su correo le llega un codigo de 6 digitos
router.post('/auth/verificar-otp', authController.verificarOtp);

module.exports = router;
