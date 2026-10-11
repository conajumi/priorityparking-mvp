// src/public/controlador-mapa.js
const respuesta = await fetch('/api/auth/verificar-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo_alumno: 'U20304050', codigo_otp: '123456' })
});

const datos = await respuesta.json();

if (respuesta.ok) {
    // ¡Garantía de Autorización!: Guardamos el JWT en el navegador del alumno
    localStorage.setItem('token_parking', datos.token);
    
    // Ahora cargamos el mapa adjuntando el token en los encabezados
    renderizarMapaEstacionamientos();
}

// Variables de estado del alumno autenticado
let estudianteLogueado = {
    codigo: null,
    autenticado: false
};

/**
 * PASO 1: Captura el envío del formulario de correo institucional
 */
async function solicitarAccesoParking(event) {
    event.preventDefault(); // Evita recargar la página web
    
    const inputCorreo = document.getElementById('correoEstudiante').value;
    const zonaMensajes = document.getElementById('zonaMensajesError');

    try {
        const respuesta = await fetch('/api/auth/solicitar-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: inputCorreo })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            zonaMensajes.style.color = '#e74c3c'; // Rojo - Error
            zonaMensajes.innerText = datos.error;
            return;
        }

        // Si es apto por el ETL y el dominio es correcto (200 OK)
        zonaMensajes.style.color = '#2ecc71'; // Verde - Éxito
        zonaMensajes.innerText = datos.mensaje;
        
        // Guardamos temporalmente el código del alumno
        estudianteLogueado.codigo = datos.codigoAlumno;

        // Desplegar el bloque en tu Mockup para que el alumno digite los 6 dígitos
        document.getElementById('seccionIngresoOtp').style.display = 'block';

    } catch (error) {
        console.error('Error en Frontend:', error);
        zonaMensajes.style.color = '#e74c3c';
        zonaMensajes.innerText = 'Error al conectar con el servidor de la UTP.';
    }
}

/**
 * PASO 2: Envía los 6 dígitos del OTP para obtener acceso al plano
 */
async function verificarCodigoOtp(event) {
    event.preventDefault();
    const tokenDigitado = document.getElementById('campoOtp').value;
    const zonaMensajes = document.getElementById('zonaMensajesError');

    try {
        const respuesta = await fetch('/api/auth/verificar-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                codigo_alumno: estudianteLogueado.codigo, 
                codigo_otp: tokenDigitado 
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            zonaMensajes.style.color = '#e74c3c';
            zonaMensajes.innerText = datos.error;
            return;
        }

        // Acceso concedido
        estudianteLogueado.autenticado = true;
        zonaMensajes.style.color = '#2ecc71';
        zonaMensajes.innerText = datos.mensaje;

        // Pintar o refrescar visualmente el mapa interactivo de Lima Centro
        renderizarMapaEstacionamientos();

    } catch (error) {
        zonaMensajes.style.color = '#e74c3c';
        zonaMensajes.innerText = 'Fallo en la verificación del token.';
    }
}

/**
 * PASO 3: Consume el mapa y renderiza dinámicamente según colores
 */
async function renderizarMapaEstacionamientos() {
    const gridContenedor = document.getElementById('gridMapa');
    
    try {
        const respuesta = await fetch('/api/garita/espacios');
        const espacios = await respuesta.json();

        gridContenedor.innerHTML = ''; // Limpiar la cuadrícula vieja

        espacios.forEach(slot => {
            const cuadroHtml = document.createElement('div');
            // Inyecta dinámicamente las clases CSS que definimos (DISPONIBLE, RESERVADO, OCUPADO)
            cuadroHtml.className = `espacio ${slot.estado}`;
            cuadroHtml.innerHTML = `<strong>${slot.id_espacio}</strong><br><small>${slot.estado}</small>`;
            
            // Si el cuadro está libre y el alumno se autenticó, habilitar clic para apartar
            if (slot.estado === 'DISPONIBLE' && estudianteLogueado.autenticado) {
                cuadroHtml.onclick = () => procesarReservaDeSlot(slot.id_espacio);
            }

            gridContenedor.appendChild(cuadroHtml);
        });
    } catch (error) {
        gridContenedor.innerHTML = '<p>Error de red al cargar la cochera.</p>';
    }
}

async function procesarReservaDeSlot(idEspacio) {
    alert(`Procesando reserva para el espacio ${idEspacio} a nombre de ${estudianteLogueado.codigo}`);
    // Aquí se gatillaría el POST final para consolidar la reserva en BD
}
