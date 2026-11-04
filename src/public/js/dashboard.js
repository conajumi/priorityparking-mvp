document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('tokenSession');
    const codigoAlumno = sessionStorage.getItem('alumnoLogueado');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Actualizar nombre/código en la interfaz
    if (codigoAlumno) {
        document.getElementById('userNameLabel').textContent = codigoAlumno;
        document.getElementById('nombreCorto').textContent = codigoAlumno;
    }

    // Consultar disponibilidad de espacios en tiempo real
    try {
        const res = await fetch('/api/garita/espacios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const espacios = await res.json();
            const disponibles = espacios.filter(e => e.estado === 'DISPONIBLE').length;
            document.getElementById('metricEspacios').textContent = disponibles;
        }
    } catch (err) {
        console.error("No se pudo cargar la métrica de espacios:", err);
    }

    // Botón de Cerrar Sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/login';
    });
});