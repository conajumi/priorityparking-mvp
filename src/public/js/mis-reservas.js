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

    let todasLasReservas = [];
    let vistaActual = 'PROXIMAS';

    const container = document.getElementById('listaReservasContainer');
    const tabProximas = document.getElementById('tabProximas');
    const tabAnteriores = document.getElementById('tabAnteriores');

    try {
        const res = await fetch(`/api/reservas/mis-reservas?codigoAlumno=${codigoAlumno}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            todasLasReservas = await res.json();
            renderizar();
        } else {
            container.innerHTML = '<p style="text-align:center;color:#64748b;padding:2rem;">No se pudieron cargar las reservas.</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="text-align:center;color:red;padding:2rem;">Error al comunicarse con la base de datos.</p>';
    }

    tabProximas.addEventListener('click', () => {
        tabProximas.classList.add('active');
        tabAnteriores.classList.remove('active');
        vistaActual = 'PROXIMAS';
        renderizar();
    });

    tabAnteriores.addEventListener('click', () => {
        tabAnteriores.classList.add('active');
        tabProximas.classList.remove('active');
        vistaActual = 'ANTERIORES';
        renderizar();
    });

    function renderizar() {
        const hoy = new Date().toISOString().split('T')[0];
        const filtradas = todasLasReservas.filter(r => {
            const fRes = (r.fecha_reserva || '').split('T')[0];
            return vistaActual === 'PROXIMAS' ? fRes >= hoy : fRes < hoy;
        });

        if (filtradas.length === 0) {
            container.innerHTML = `<p style="text-align:center;color:#64748b;padding:2rem;">No tienes reservas ${vistaActual.toLowerCase()}.</p>`;
            return;
        }

        container.innerHTML = filtradas.map(r => {
            const fecha = (r.fecha_reserva || '').split('T')[0];
            const hora = (r.hora_llegada_programada || '').substring(0, 5);
            const slot = r.id_espacio;
            const estado = r.estado_reserva;

            let badgeClass = 'badge-pendiente';
            if (estado === 'COMPLETADA') badgeClass = 'badge-confirmada';
            if (estado === 'EXPIRADA' || estado === 'CANCELADA') badgeClass = 'badge-expirada';

            return `
                <div class="reserva-item">
                    <div>
                        <strong>${fecha} · ${hora} · Slot ${slot}</strong><br>
                        <span class="badge-estado ${badgeClass}">${estado}</span>
                    </div>
                    <div>
                        <button class="btn-qr" onclick="alert('Pase de Acceso\\nSlot: ${slot}\\nFecha: ${fecha}')">Ver QR</button>
                        ${estado === 'PENDIENTE' ? `<button class="btn-cancel" onclick="cancelar('${fecha}')">Cancelar</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    window.cancelar = async (fecha) => {
        if (!confirm(`¿Deseas cancelar la reserva del ${fecha}?`)) return;
        try {
            const res = await fetch('/api/reservas/cancelar', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ codigo_alumno: codigoAlumno, fecha_reserva: fecha })
            });
            if (res.ok) {
                alert("Reserva cancelada con éxito");
                location.reload();
            } else {
                alert("No se pudo cancelar la reserva.");
            }
        } catch (error) {
            alert("Error de comunicación con el servidor.");
        }
    };

    const btnLogout = document.getElementById('btnCerrarSesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '/login';
        });
    }
});