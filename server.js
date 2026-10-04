// server.js
require('dotenv').config();

// ¡CORRECCIÓN DE RUTA!: Ahora importa el archivo de configuración desde la carpeta src
const app = require('./src/app'); 

const PORT = process.env.PORT || 3000;

// Encender el servidor
app.listen(PORT, () => {
    console.log(`\n🚗 ==================================================== 🚗`);
    console.log(`   PriorityParking MVP - Sede Lima Centro Activa`);
    console.log(`   Servidor levantado exitosamente en la raíz del proyecto`);
    console.log(`   Ejecutándose localmente en: http://localhost:${PORT}`);
    console.log(`   Endpoints API listos bajo el prefijo: /api`);
    console.log(`🚗 ==================================================== 🚗\n`);
});

// Mecanismos Anti-Crash globales [2.4]
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [CRÍTICO] Rechazo no manejado en promesa:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ [CRÍTICO] Excepción no controlada en el código:', error);
});
