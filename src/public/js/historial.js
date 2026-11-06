document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('tokenSession');
    const codigoAlumno = sessionStorage.getItem('alumnoLogueado');

    if (!token || !codigoAlumno) {
        window.location.href = '/login';
        return;
    }

    const userNameLabel = document.getElementById('userNameLabel');
    if (userNameLabel) {
        userNameLabel.textContent = codigoAlumno;
    }

    let historialCompleto = [];
    let filtroActivo = 'TODOS';

    const tbody = document.getElementById('tablaHistorialBody');
    const botonesFiltro = document.querySelectorAll('.btn-filtro');

    try {
        // Obtenemos las reservas del alumno
        const res = await fetch(`/api/reservas/mis-reservas?codigoAlumno=${codigoAlumno}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const reservas = await res.json();
            
            // Mapeamos los datos al formato de la tabla del Mockup E08
            historialCompleto = reservas.map(r => {
                let tipo = 'Reserva';
                let estadoTexto = 'Confirmada';
                let badgeClass = 'badge-confirmada';

                if (r.estado_reserva === 'CANCELADA') {
                    tipo = 'Cancelación';
                    estadoTexto = 'Cancelada';
                    badgeClass = 'badge-cancelada';
                } else if (r.estado_reserva === 'EXPIRADA') {
                    tipo = 'Penalidad';
                    estadoTexto = 'Penalizado';
                    badgeClass = 'badge-penalizado';
                } else if (r.estado_reserva === 'PENDIENTE') {
                    tipo = 'Reserva';
                    estadoTexto = 'Pendiente';
                    badgeClass = 'badge-pendiente';
                }

                const fechaObj = new Date(r.fecha_reserva);
                const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

                return {
                    fecha: fechaStr,
                    tipo: tipo,
                    descripcion: tipo === 'Penalidad' ? 'Inasistencia sin aviso' : `Espacio ${r.id_espacio}`,
                    estado: estadoTexto,
                    badgeClass: badgeClass
                };
            });

            renderizarTabla();
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No se pudo cargar el historial.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state" style="color:red;">Error de conexión con la base de datos.</td></tr>';
    }

    // Configurar botones de filtro
    botonesFiltro.forEach(btn => {
        btn.addEventListener('click', () => {
            botonesFiltro.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroActivo = btn.dataset.filtro;
            renderizarTabla();
        });
    });

    function renderizarTabla() {
        const filtrados = historialCompleto.filter(item => {
            if (filtroActivo === 'TODOS') return true;
            if (filtroActivo === 'RESERVAS') return item.tipo === 'Reserva';
            if (filtroActivo === 'CANCELACIONES') return item.tipo === 'Cancelación';
            if (filtroActivo === 'PENALIDADES') return item.tipo === 'Penalidad';
            return true;
        });

        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay registros para este filtro.</td></tr>';
            return;
        }

        tbody.innerHTML = filtrados.map(item => `
            <tr>
                <td>${item.fecha}</td>
                <td>${item.tipo}</td>
                <td>${item.descripcion}</td>
                <td><span class="badge-status ${item.badgeClass}">${item.estado}</span></td>
            </tr>
        `).join('');
    }

    // Botón Salir
    const btnLogout = document.getElementById('btnCerrarSesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '/login';
        });
    }
});