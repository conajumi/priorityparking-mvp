let codigoAlumno = '';

document.addEventListener('DOMContentLoaded', () => {
    codigoAlumno = sessionStorage.getItem('alumnoLogueado');
    if (!codigoAlumno) {
        window.location.href = '/login';
        return;
    }

    document.getElementById('displayCodigo').innerText = codigoAlumno;
    
    // Asignación de listeners
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    document.getElementById('btnCancelarReserva').addEventListener('click', cancelarMiReserva);
    
    const btnCerrarQr = document.getElementById('btn-cerrar-qr');
    if (btnCerrarQr) {
        btnCerrarQr.addEventListener('click', () => {
            const modal = document.getElementById('modal-confirmacion-qr');
            if (modal) modal.style.display = 'none';
            cargarMapaWeb();
        });
    }

    configurarCamposFechaHora();
    cargarMapaWeb();
});

function configurarCamposFechaHora() {
    const inputFecha = document.getElementById('fechaLlegada');
    const inputHora = document.getElementById('horaLlegada');

    const hoy = new Date();
    const formatoHoy = hoy.toLocaleDateString('sv-SE');

    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const formatoMañana = mañana.toLocaleDateString('sv-SE');

    inputFecha.value = formatoHoy;
    inputFecha.min = formatoHoy;
    inputFecha.max = formatoMañana;

    const horas = String(hoy.getHours()).padStart(2, '0');
    const minutos = String(hoy.getMinutes()).padStart(2, '0');

    if (inputHora) {
        inputHora.value = `${horas}:${minutos}`;
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('alumnoLogueado');
    sessionStorage.removeItem('tokenSession');
    sessionStorage.removeItem('rolUsuario');
    window.location.href = '/login';
}

function mostrarNotificacion(texto, tipo) {
    const box = document.getElementById('panelAlert');
    box.innerText = texto;
    box.className = `alert ${tipo}`;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 5000);
}

async function cargarMapaWeb() {
    const grid = document.getElementById('contenedorMapa');
    const tokenJWT = sessionStorage.getItem('tokenSession');
    try {
        const res = await fetch('/api/garita/espacios', {
            headers: { 'Authorization': `Bearer ${tokenJWT}` }
        });
        const espacios = await res.json();
        grid.innerHTML = '';

        espacios.forEach(espacio => {
            const div = document.createElement('div');
            div.className = `slot ${espacio.estado}`;
            div.innerHTML = `<div>${espacio.id_espacio}</div><small>${espacio.estado}</small>`;

            if (espacio.estado === 'DISPONIBLE') {
                div.onclick = () => solicitarReservaSlot(espacio.id_espacio);
            }
            grid.appendChild(div);
        });
    } catch (err) {
        grid.innerHTML = '<p style="color:red;">Error de conexión.</p>';
    }
}

async function cancelarMiReserva() {
    const fechaElegida = document.getElementById('fechaLlegada').value;
    const tokenJWT = sessionStorage.getItem('tokenSession');

    if (!fechaElegida) {
        alert('Por favor, asegúrate de seleccionar una fecha válida primero.');
        return;
    }

    if (!confirm(`¿Estás completamente seguro de que deseas cancelar tu reserva para el día ${fechaElegida}?`)) {
        return;
    }

    try {
        const res = await fetch('/api/reservas/cancelar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenJWT}`
            },
            body: JSON.stringify({
                codigo_alumno: codigoAlumno,
                fecha_reserva: fechaElegida
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo procesar la cancelación.');

        alert(data.mensaje || 'Reserva cancelada con éxito.');
        mostrarNotificacion(data.mensaje, 'success');
        await cargarMapaWeb();
    } catch (err) {
        alert(`Error al cancelar: ${err.message}`);
        mostrarNotificacion(err.message, 'error');
    }
}

async function solicitarReservaSlot(idEspacio) {
    const fechaElegida = document.getElementById('fechaLlegada').value;
    const horaElegida = document.getElementById('horaLlegada').value;
    const tokenJWT = sessionStorage.getItem('tokenSession');

    if (!horaElegida) return alert('Por favor, ingresa una hora estimada de llegada.');
    if (!confirm(`¿Separar el slot ${idEspacio} para hoy a las ${horaElegida}?`)) return;

    try {
        const res = await fetch('/api/reservas/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenJWT}`
            },
            body: JSON.stringify({
                codigo_alumno: codigoAlumno,
                id_espacio: idEspacio,
                otp_verificado: '000000',
                fecha_reserva: fechaElegida,
                hora_llegada: horaElegida
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Fallo al procesar tu reserva.');

        if (data.qrCode) {
            const imgQR = document.getElementById('qr-reserva-img');
            if (imgQR) imgQR.src = data.qrCode;

            const txtPlaza = document.getElementById('qr-plaza-id');
            if (txtPlaza) txtPlaza.textContent = idEspacio;

            const txtFecha = document.getElementById('qr-fecha');
            if (txtFecha) txtFecha.textContent = fechaElegida;

            const modal = document.getElementById('modal-confirmacion-qr');
            if (modal) modal.style.display = 'flex';
        }

        mostrarNotificacion(data.mensaje, 'success');
        cargarMapaWeb();
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}