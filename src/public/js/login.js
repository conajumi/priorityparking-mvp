let codigoAlumnoDetectado = '';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnSolicitarOtp').addEventListener('click', enviarCorreo);
    document.getElementById('btnVerificarOtp').addEventListener('click', enviarOtp);
});

function mostrarMensaje(texto, tipo) {
    const box = document.getElementById('alertBox');
    box.innerText = texto;
    box.className = `alert ${tipo}`;
    box.classList.remove('hidden');
}

async function enviarCorreo() {
    const correo = document.getElementById('correo').value.trim();
    if (!correo) return mostrarMensaje('Ingresa tu correo institucional.', 'error');

    try {
        const res = await fetch('/api/auth/solicitar-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'No se pudo enviar el código.');

        codigoAlumnoDetectado = data.codigoAlumno;
        
        document.getElementById('groupEmail').classList.add('hidden');
        document.getElementById('groupOtp').classList.remove('hidden');
        mostrarMensaje(data.mensaje, 'success');
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}

async function enviarOtp() {
    const otp = document.getElementById('otp').value.trim();
    if (!otp) return mostrarMensaje('Ingresa el código OTP enviado.', 'error');

    try {
        const res = await fetch('/api/auth/verificar-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                codigoAlumno: codigoAlumnoDetectado,
                otp: otp 
            })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Código incorrecto.');

        sessionStorage.setItem('alumnoLogueado', codigoAlumnoDetectado);
        sessionStorage.setItem('tokenSession', data.token); 
        sessionStorage.setItem('rolUsuario', data.rol);
        
        mostrarMensaje('Acceso correcto. Redireccionando...', 'success');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);

    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}