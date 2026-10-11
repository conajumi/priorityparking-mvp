const express = require('express');
const router = express.Router();
const { verificarRol } = require('../middlewares/auth.middleware'); // Importar el middleware

// Importar los controladores desarrollados
const authController = require('../modules/auth/auth.controller');
const espaciosController = require('../modules/estacionales/espacios.controller');
const reservasController = require('../modules/reservas/reservas.controller');

/**
 * ==========================================
 * RUTAS DEL MÓDULO 1: AUTENTICACIÓN
 * ==========================================
 */
// Alumno solicita el código OTP ingresando su correo institucional
router.post('/auth/solicitar-otp', authController.solicitarOtp);

// Verificacion de codigo OTP, cuando se inicia sesion con su correo le llega un codigo de 6 digitos
router.post('/auth/verificar-otp', authController.verificarOtp);

/**
 * ==========================================
 * RUTAS DEL MÓDULO 2 Y 3: OPERACIONES DE GARITA Y MAPA
 * ==========================================
 
// Rutas Protegidas para el Mapa (Accesibles por Estudiantes, Vigilantes y Administradores)
router.get('/garita/espacios', verificarRol(['ESTUDIANTE', 'GARITA', 'ADMIN']), espaciosController.listarEspacios);

// Rutas de Control de Garita (Exclusivas para el Vigilante o Administrador)
router.post('/garita/registrar-ingreso', verificarRol(['GARITA', 'ADMIN']), reservasController.registrarIngresoVehiculo);
router.post('/garita/registrar-salida', verificarRol(['GARITA', 'ADMIN']), reservasController.registrarSalidaVehiculo);

// Rutas Administrativas (Exclusivas para el Administrador de la Sede)
router.patch('/garita/espacios/estado', verificarRol(['ADMIN']), espaciosController.actualizarEstadoEspacio);

// Obtener el mapa de espacios en tiempo real (Usado por Alumnos y el Monitor de Garita)
router.get('/garita/espacios', reservasController.obtenerEspaciosGarita);

// Registrar el ingreso físico del vehículo (Vigilante presiona "Ingresar" en su panel)
router.post('/garita/registrar-ingreso', reservasController.registrarIngresoVehiculo);

// Registrar la salida y liberar el espacio (Vigilante presiona "Liberar" al salir el auto)
router.post('/garita/registrar-salida', reservasController.registrarSalidaVehiculo);

// Crear una nueva reserva desde el panel del alumno
router.post('/reservas/crear', reservasController.crearReservaAlumno);
*/

/**
 * =================================================================
 * RUTAS PROTEGIDAS CON AUTENTICACIÓN JWT Y CONTROL DE ROLES
 * =================================================================
 */

// 1. Obtener el mapa de espacios en tiempo real (Accesible por Estudiantes, Vigilantes y Administradores)
router.get('/garita/espacios', verificarRol(['ESTUDIANTE', 'GARITA', 'ADMIN']), reservasController.obtenerEspaciosGarita);

// 2. Registrar el ingreso físico del vehículo (Exclusivo para el Vigilante o Administrador en Garita)
router.post('/garita/registrar-ingreso', verificarRol(['GARITA', 'ADMIN']), reservasController.registrarIngresoVehiculo);

// 3. Registrar la salida y liberar el espacio (Exclusivo para el Vigilante o Administrador en Garita)
router.post('/garita/registrar-salida', verificarRol(['GARITA', 'ADMIN']), reservasController.registrarSalidaVehiculo);

// 4. Crear una nueva reserva desde el panel del alumno (Exclusivo para Alumnos/Estudiantes)
router.post('/reservas/crear', verificarRol(['ESTUDIANTE']), reservasController.crearReservaAlumno);

// 5. Cancelar una reserva activa por parte del alumno
router.post('/reservas/cancelar', verificarRol(['ESTUDIANTE']), reservasController.cancelarReservaAlumno);


module.exports = router;
