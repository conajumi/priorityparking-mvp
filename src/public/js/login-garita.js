document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnIngresarGarita').addEventListener('click', autenticarGarita);
});

function mostrarMensaje(texto, tipo) {
    const box = document.getElementById('alertBox');
    box.innerText = texto;
    box.className = `alert ${tipo}`;
    box.classList.remove('hidden');
}

async function autenticarGarita() {
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!usuario || !password) {
        return mostrarMensaje('Por favor, complete todas las credenciales.', 'error');
    }

    try {
        const res = await fetch('/api/auth/verificar-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                codigoAlumno: usuario, 
                otp: password 
            })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Credenciales inválidas para el personal de garita.');

        sessionStorage.setItem('operadorLogueado', usuario);
        sessionStorage.setItem('tokenSession', data.token);
        sessionStorage.setItem('rolUsuario', data.rol);
        
        mostrarMensaje('Autenticación de seguridad aprobada. Conectando monitor...', 'success');
        
        setTimeout(() => {
            window.location.href = '/garita';
        }, 1500);

    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}