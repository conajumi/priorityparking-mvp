document.addEventListener('DOMContentLoaded', () => {
    // Verificación de credenciales de sesión en cliente
    const operador = sessionStorage.getItem('operadorLogueado');
    const rol = sessionStorage.getItem('rolUsuario');

    if (!operador || rol !== 'GARITA') {
        alert('Acceso restringido. Solo personal de seguridad autorizado.');
        window.location.href = '/login-garita';
        return;
    }

    // Enlazar eventos de botones
    document.getElementById('btnRegistrarIngreso').addEventListener('click', registrarIngreso);
    document.getElementById('btnRefrescarMonitor').addEventListener('click', cargarMapaMonitoreo);
    
    const btnLogout = document.getElementById('btnCerrarSesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    // Carga inicial
    cargarMapaMonitoreo();
});

function cerrarSesion() {
    sessionStorage.removeItem('operadorLogueado');
    sessionStorage.removeItem('tokenSession');
    sessionStorage.removeItem('rolUsuario');
    window.location.href = '/login-garita';
}

function mostrarAlerta(mensaje, tipo) {
    const el = document.getElementById('globalAlert');
    el.innerText = mensaje;
    el.className = `alert ${tipo}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

// 1. Obtener y renderizar estado de espacios
async function cargarMapaMonitoreo() {
    const container = document.getElementById('monitorMapa');
    container.innerHTML = '<p class="status-loading">Consultando base de datos...</p>';
    
    const tokenJWT = sessionStorage.getItem('tokenSession'); 

    try {
        const res = await fetch('/api/garita/espacios', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenJWT}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error('No autorizado. Inicie sesión desde el portal de garita.');
        }

        const espacios = await res.json();
        container.innerHTML = '';

        espacios.forEach(espacio => {
            const div = document.createElement('div');
            div.className = `slot ${espacio.estado}`;
            
            const idDiv = document.createElement('div');
            idDiv.className = 'slot-slot-id';
            idDiv.textContent = espacio.id_espacio;

            const small = document.createElement('small');
            small.className = 'slot-status';
            small.textContent = espacio.estado;

            div.appendChild(idDiv);
            div.appendChild(small);

            if (espacio.estado === 'OCUPADO') {
                const btnLiberar = document.createElement('button');
                btnLiberar.className = 'btn-liberar';
                btnLiberar.textContent = 'Liberar Slot';
                btnLiberar.addEventListener('click', () => registrarSalida(espacio.id_espacio));
                div.appendChild(btnLiberar);
            }

            container.appendChild(div);
        });
    } catch (err) {
        container.innerHTML = `<p class="status-error">${err.message}</p>`;
    }
}

// 2. Registrar ingreso de vehículo
async function registrarIngreso() {
    const codigoInput = document.getElementById('codigo_alumno');
    const espacioInput = document.getElementById('id_espacio');

    const codigo_alumno = codigoInput.value.trim();
    const id_espacio = espacioInput.value.trim();
    const tokenJWT = sessionStorage.getItem('tokenSession'); 

    if (!codigo_alumno || !id_espacio) {
        mostrarAlerta('Por favor, complete ambos campos para validar el ingreso.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/garita/registrar-ingreso', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenJWT}`
            },
            body: JSON.stringify({ codigo_alumno, id_espacio })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'No se pudo procesar el ingreso.');

        mostrarAlerta(data.mensaje, 'success');
        codigoInput.value = '';
        espacioInput.value = '';
        cargarMapaMonitoreo();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}

// 3. Registrar salida física
async function registrarSalida(idEspacio) {
    if (!confirm(`¿Confirmas la salida del vehículo del slot ${idEspacio}?`)) return;
    const tokenJWT = sessionStorage.getItem('tokenSession'); 

    try {
        const res = await fetch('/api/garita/registrar-salida', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenJWT}`
            },
            body: JSON.stringify({ id_espacio: idEspacio })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'No se pudo procesar la salida.');

        mostrarAlerta(data.mensaje, 'success');
        cargarMapaMonitoreo();
    } catch (err) {
        mostrarAlerta(err.message, 'error');
    }
}