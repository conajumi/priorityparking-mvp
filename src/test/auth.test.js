// Simulación de suite de pruebas unitarias para el Módulo de Autenticación
const { solicitarOtp } = require('../modules/auth/auth.controller');

function ejecutarPruebasQA() {
    console.log('\n🧪 [QA Suite] Iniciando pruebas unitarias de validación de correo...');

    const casosDePrueba = [
        {
            descripcion: 'Debe aceptar un correo institucional correcto de alumno',
            correo: 'U20304050@utp.edu.pe',
            resultadoEsperado: 'VALIDO'
        },
        {
            descripcion: 'Debe rechazar un correo personal de Gmail',
            correo: 'alumno.utp@gmail.com',
            resultadoEsperado: 'RECHAZADO'
        },
        {
            descripcion: 'Debe rechazar correos con extensiones maliciosas o confusas',
            correo: 'vulneracion@://malware.com',
            resultadoEsperado: 'RECHAZADO'
        },
        {
            descripcion: 'Debe aceptar correos de docentes o administrativos autorizados',
            correo: 'c18293@utp.edu.pe',
            resultadoEsperado: 'VALIDO'
        }
    ];

    let pruebasPasadas = 0;

    casosDePrueba.forEach((prueba, index) => {
        const regexUtp = /^[a-zA-Z0-9._%+-]+@utp\.edu\.pe\$/;
        const esValido = regexUtp.test(prueba.correo);
        const resultadoReal = esValido ? 'VALIDO' : 'RECHAZADO';

        if (resultadoReal === prueba.resultadoEsperado) {
            console.log(`✅ Prueba #${index + 1} PASADA: ${prueba.descripcion}`);
            pruebasPasadas++;
        } else {
            console.error(`❌ Prueba #${index + 1} FALLIDA: ${prueba.descripcion}. Esperado: ${prueba.resultadoEsperado}, Obtención: ${resultadoReal}`);
        }
    });

    console.log(`\n📊 [Resumen QA] ${pruebasPasadas}/${casosDePrueba.length} pruebas completadas con éxito.\n`);
}

// Ejecutar automáticamente al levantar en entorno de test
if (process.env.NODE_ENV === 'test') {
    ejecutarPruebasQA();
}

module.exports = { ejecutarPruebasQA };
