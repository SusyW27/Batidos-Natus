// Panel de Admin

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    
    // Verificar que sea admin
    if (!currentUser || currentUser.role !== 'admin') {
        alert('⚠️ Acceso denegado. Debes iniciar sesión como administrador.');
        window.location.href = 'login.html';
        return;
    }

    // Mostrar usuario admin
    document.getElementById('adminUser').textContent = `👤 ${currentUser.username}`;
    renderEstadisticas();
    renderPedidos();

    // Evento para cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                logout(); // Usa la función de auth.js
            }
        });
    }
});

function renderEstadisticas() {
    const stats = getEstadisticasPedidos();
    document.getElementById('totalPedidos').textContent = stats.totalPedidos;
    document.getElementById('totalVentas').textContent = `$${stats.totalVentas.toFixed(2)}`;
    document.getElementById('pendientes').textContent = stats.porEstado.Pendiente || 0;
    document.getElementById('preparando').textContent = stats.porEstado.Preparando || 0;
    document.getElementById('enviados').textContent = stats.porEstado.Enviado || 0;
    document.getElementById('entregados').textContent = stats.porEstado.Entregado || 0;
}

function renderPedidos() {
    const pedidos = getPedidos();
    const tbody = document.getElementById('pedidosBody');
    
    if (pedidos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-message">No hay pedidos registrados</td></tr>`;
        return;
    }

    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = '';
    pedidos.forEach(pedido => {
        const productosResumen = pedido.productos.map(p => 
            `${p.nombre} x${p.cantidad}`
        ).join(', ');

        const estadoClass = `estado-${pedido.estado.toLowerCase()}`;

        html += `
            <tr>
                <td><strong>${pedido.numero}</strong></td>
                <td>${pedido.usuario}</td>
                <td style="font-size:0.85rem;">${productosResumen}</td>
                <td><strong>$${pedido.total.toFixed(2)}</strong></td>
                <td>${formatearFecha(pedido.fecha)}</td>
                <td>
                    <span class="estado-badge ${estadoClass}">${pedido.estado}</span>
                </td>
                <td>
                    <select class="estado-select" data-id="${pedido.id}" onchange="cambiarEstado(this)">
                        <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="Preparando" ${pedido.estado === 'Preparando' ? 'selected' : ''}>Preparando</option>
                        <option value="Enviado" ${pedido.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                        <option value="Entregado" ${pedido.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
                    </select>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function cambiarEstado(select) {
    const pedidoId = parseInt(select.dataset.id);
    const nuevoEstado = select.value;
    
    if (confirm(`¿Cambiar estado del pedido a "${nuevoEstado}"?`)) {
        const resultado = actualizarEstadoPedido(pedidoId, nuevoEstado);
        if (resultado.success) {
            alert('✅ Estado actualizado correctamente');
            renderEstadisticas();
            renderPedidos();
        } else {
            alert(`❌ Error: ${resultado.message}`);
        }
    } else {
        renderPedidos();
    }
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}