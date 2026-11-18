document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin.js cargado');
    
    const currentUser = getCurrentUser();
    console.log('Usuario actual:', currentUser);
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Acceso denegado. Debes iniciar sesión como administrador.');
        window.location.href = 'login.html';
        return;
    }

    const adminUserSpan = document.getElementById('adminUser');
    if (adminUserSpan) {
        adminUserSpan.textContent = `${currentUser.username}`;
    }

    renderEstadisticas();
    renderPedidos();
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'logoutBtn') {
            e.preventDefault();
            console.log('Click en Cerrar Sesión');
            
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                console.log('Cerrando sesión...');
                logout();
            }
        }
    });
    initAdminTabs();
    const crearBtn = document.getElementById('crearUsuarioBtn');
    if (crearBtn) {
        crearBtn.addEventListener('click', abrirModalCrearUsuario);
    }
    setTimeout(inicializarGraficas, 500);
    setTimeout(initFiltros, 600);
    setTimeout(initStockAlerta, 700);
});

async function renderEstadisticas() {
    try {
        console.log('Cargando estadísticas...');
        const stats = await getEstadisticasPedidos();
        console.log('Estadísticas:', stats);
        
        document.getElementById('totalPedidos').textContent = stats.totalPedidos || 0;
        document.getElementById('totalVentas').textContent = `$${stats.totalVentas ? stats.totalVentas.toFixed(2) : '0.00'}`;
        document.getElementById('pendientes').textContent = stats.porEstado?.Pendiente || 0;
        document.getElementById('pagados').textContent = stats.porEstado?.Pagado || 0;
        document.getElementById('cancelados').textContent = stats.porEstado?.Cancelado || 0;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        document.getElementById('totalPedidos').textContent = '0';
        document.getElementById('totalVentas').textContent = '$0.00';
        document.getElementById('pendientes').textContent = '0';
        document.getElementById('pagados').textContent = '0';
        document.getElementById('cancelados').textContent = '0';
    }
}

async function renderPedidos() {
    try {
        console.log('Cargando pedidos...');
        
        const pedidos = await getPedidosActivos();
        console.log('Pedidos obtenidos:', pedidos);
        
        const tbody = document.getElementById('pedidosBody');
        
        if (!tbody) {
            console.error('No se encontró #pedidosBody');
            return;
        }
        
        if (!pedidos || pedidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-message">No hay pedidos registrados</td></tr>`;
            return;
        }

        let html = '';
        pedidos.forEach(pedido => {
            const estado = pedido.estado || 'Pendiente';
            const estadoNormalizado = estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
            const estadoClass = `estado-${estadoNormalizado.toLowerCase()}`;
            
            html += `
                <tr>
                    <td><strong>${pedido.numero_pedido || pedido.id_pedido || 'N/A'}</strong></td>
                    <td>${pedido.cliente || 'Sin cliente'}</td>
                    <td style="font-size:0.85rem;">${pedido.productos || 'Sin productos'}</td>
                    <td><strong>$${parseFloat(pedido.total || 0).toFixed(2)}</strong></td>
                    <td>${formatearFecha(pedido.fecha)}</td>
                    <td>
                        <span class="estado-badge ${estadoClass}">${estadoNormalizado}</span>
                    </td>
                    <td>
                        <select class="estado-select" data-id="${pedido.id_pedido}" onchange="cambiarEstado(this)">
                            <option value="Pendiente" ${estadoNormalizado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Pagado" ${estadoNormalizado === 'Pagado' ? 'selected' : ''}>Pagado</option>
                            <option value="Cancelado" ${estadoNormalizado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        const tbody = document.getElementById('pedidosBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-message">Error al cargar pedidos: ${error.message}</td></tr>`;
        }
    }
}

async function cambiarEstado(select) {
    const pedidoId = parseInt(select.dataset.id);
    const nuevoEstado = select.value;
    
    if (confirm(`¿Cambiar estado del pedido a "${nuevoEstado}"?`)) {
        try {
            const resultado = await actualizarEstadoPedido(pedidoId, nuevoEstado);
            if (resultado.success) {
                alert('Estado actualizado correctamente');
                renderEstadisticas();
                renderPedidos();
            } else {
                alert(`Error: ${resultado.message}`);
                renderPedidos();
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar estado. Intenta de nuevo.');
            renderPedidos();
        }
    } else {
        renderPedidos();
    }
}

function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.dataset.tab;
            const contentId = `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
            document.getElementById(contentId).classList.add('active');
            
            if (tabId === 'usuarios') {
                cargarUsuarios();
            }
            
            if (tabId === 'dashboard') {
                setTimeout(recargarGraficas, 300);
            }
        });
    });
}

const originalRenderPedidos = window.renderPedidos;
if (originalRenderPedidos) {
    window.renderPedidos = function() {
        const fechaDesde = document.getElementById('filtroFechaDesde')?.value;
        const fechaHasta = document.getElementById('filtroFechaHasta')?.value;
        const estado = document.getElementById('filtroEstado')?.value;
        const cliente = document.getElementById('filtroCliente')?.value;
        const numero = document.getElementById('filtroNumero')?.value;
        
        if (fechaDesde || fechaHasta || estado || cliente || numero) {
            aplicarFiltros();
        } else {
            originalRenderPedidos();
        }
    };
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return 'Fecha no disponible';
    try {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return fechaISO;
    }
}

window.cambiarEstado = cambiarEstado;
window.renderEstadisticas = renderEstadisticas;
window.renderPedidos = renderPedidos;
window.initAdminTabs = initAdminTabs;

console.log('admin.js cargado correctamente');