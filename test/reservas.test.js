const request = require('supertest');
const express = require('express');

// 1. Mock de los middlewares de autenticación para que siempre den paso libre en tests
jest.mock('../src/middlewares/auth.middleware', () => ({
  verificarRol: () => (req, res, next) => next(),
  verificarToken: (req, res, next) => next()
}));

// 2. Mock de los servicios de reservas
jest.mock('../src/modules/reservas/reservas.service', () => ({
  ejecutarReservaTransaccional: jest.fn().mockResolvedValue({
    reserva: { id_reserva: 101, estado_reserva: 'PENDIENTE' },
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  }),
  ejecutarCancelacionTransaccional: jest.fn().mockResolvedValue(true),
  ejecutarSalidaTransaccional: jest.fn().mockResolvedValue(true),
  obtenerTodosLosEspacios: jest.fn().mockResolvedValue([])
}));

const apiRoutes = require('../src/routes/api.routes');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Calidad Funcional y Pruebas Automatizadas - ISO/IEC 25010', () => {

  test('CP01: Registro exitoso de reserva de estacionamiento y código QR', async () => {
    const payload = {
      codigo_alumno: 'U20304050',
      id_espacio: 'LC-P1-01',
      otp_verificado: '123456',
      fecha_reserva: '2026-11-02',
      hora_llegada: '08:30:00'
    };

    const res = await request(app)
      .post('/api/reservas/crear')
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('qrCode');
    expect(res.body.qrCode).toContain('data:image/png;base64');
  });

  test('CP02: Bloqueo de reserva por falta de datos obligatorios', async () => {
    const payloadIncompleto = {
      codigo_alumno: 'U20304050'
    };

    const res = await request(app)
      .post('/api/reservas/crear')
      .send(payloadIncompleto);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Faltan parámetros obligatorios');
  });

  test('CP03: Cancelación de reserva y liberación de cupo', async () => {
    const payloadCancelacion = {
      codigo_alumno: 'U20304050',
      fecha_reserva: '2026-11-02'
    };

    const res = await request(app)
      .post('/api/reservas/cancelar')
      .send(payloadCancelacion);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mensaje');
    expect(res.body.mensaje).toContain('cancelada con éxito');
  });

  test('CP04: Transición de estado en garita (Liberación de espacio tras salida)', async () => {
    const payloadSalida = {
      id_espacio: 'LC-P1-01'
    };

    const res = await request(app)
      .post('/api/garita/registrar-salida')
      .send(payloadSalida);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mensaje');
    expect(res.body.mensaje).toContain('liberado de inmediato');
  });
});