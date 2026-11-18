document.addEventListener('DOMContentLoaded', function() {
    console.log('empleado.js cargado');

    const currentUser = getCurrentUser();
    console.log('Usuario actual:', currentUser);
    
    if (!currentUser || (currentUser.role !== 'empleado' && currentUser.role !== 'admin')) {
        alert('Acceso denegado. Solo empleados y administradores pueden acceder.');
        window.location.href = 'login.html';
        return;
    }
    
    const welcomeDiv = document.getElementById('userWelcomeArea');
    if (welcomeDiv) {
        welcomeDiv.innerHTML = `
            <span>Hola, <strong>${currentUser.username}</strong></span>
            <a href="dashboard.html" style="color: #2c5f2d; margin-right:15px; text-decoration:none; font-weight:600;">Tienda</a>
            <button class="btn-logout" id="logoutBtn">Cerrar sesión</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', logout);
    }
    
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = `${currentUser.username}`;
    }
    
    const pedidosBtn = document.getElementById('verPedidosBtn');
    const historialBtn = document.getElementById('verHistorialBtn');
    const facturasBtn = document.getElementById('verFacturasBtn');
    
    mostrarPedidosActivos();
    
    if (pedidosBtn) {
        pedidosBtn.addEventListener('click', mostrarPedidosActivos);
    }
    
    if (historialBtn) {
        historialBtn.addEventListener('click', mostrarHistorialEmpleado);
    }
    
    if (facturasBtn) {
        facturasBtn.addEventListener('click', mostrarFacturasEmpleado);
    }
});

async function mostrarPedidosActivos() {
    console.log('Cargando pedidos activos...');
    const contentDiv = document.getElementById('dynamicContent');
    
    try {
        const pedidos = await getPedidosActivos();
        window.pedidosActivos = pedidos;
        
        const activos = pedidos.filter(p => 
            p.estado === 'Pendiente'
        );
        
        activos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const pedidosBtn = document.getElementById('verPedidosBtn');
        if (pedidosBtn) pedidosBtn.classList.add('active');
        
        if (activos.length === 0) {
            contentDiv.innerHTML = `
                <div class="pedidos-activos-container">
                    <h2>Pedidos Activos</h2>
                    <div class="empty-state-empleado">
                        <h3>No hay pedidos pendientes</h3>
                        <p>Todos los pedidos han sido pagados o cancelados.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="pedidos-activos-container">
                <h2>Pedidos Activos (${activos.length})</h2>
                <div class="pedidos-list">
        `;
        
        activos.forEach(pedido => {
            let productosResumen = 'Sin productos';
            if (Array.isArray(pedido.productos)) {
                productosResumen = pedido.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ');
            } else if (typeof pedido.productos === 'string') {
                productosResumen = pedido.productos;
            }
            
            const estadoClass = `estado-${pedido.estado?.toLowerCase() || 'pendiente'}`;
            const total = parseFloat(pedido.total || 0);
            const numero = pedido.numero_pedido || '#BAT-' + String(pedido.id_pedido).padStart(4, '0');
            
            html += `
                <div class="pedido-card-empleado">
                    <div class="pedido-info">
                        <div class="numero">${numero}</div>
                        <div class="cliente">${pedido.cliente || 'Sin cliente'}</div>
                        <div class="productos">${productosResumen}</div>
                    </div>
                    <div class="pedido-total">$${total.toFixed(2)}</div>
                    <div style="text-align:center;">
                        <span class="estado-badge ${estadoClass}">${pedido.estado || 'Pendiente'}</span>
                    </div>
                    <div class="pedido-actions">
                        <!-- SOLO 3 ESTADOS -->
                        <select id="estadoSelect_${pedido.id_pedido}" onchange="cambiarEstadoEmpleado(${pedido.id_pedido})">
                            <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Pagado" ${pedido.estado === 'Pagado' ? 'selected' : ''}>Pagado</option>
                            <option value="Cancelado" ${pedido.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                        <button class="btn-facturar" onclick="abrirPanelFactura(${pedido.id_pedido})" 
                                style="background: #e67e22; color:white; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">
                            Cobrar/Facturar
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        contentDiv.innerHTML = `
            <div class="pedidos-activos-container">
                <h2>Pedidos Activos</h2>
                <div class="empty-state-empleado" style="color: #e74c3c;">
                    <h3>Error al cargar pedidos</h3>
                    <p>${error.message}</p>
                    <button onclick="mostrarPedidosActivos()" style="background: #2c5f2d; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer; margin-top:16px;">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
    }
}

async function cambiarEstadoEmpleado(pedidoId) {
    const select = document.getElementById(`estadoSelect_${pedidoId}`);
    const nuevoEstado = select.value;
    
    if (confirm(`¿Cambiar estado del pedido a "${nuevoEstado}"?`)) {
        const resultado = await actualizarEstadoPedido(pedidoId, nuevoEstado);
        if (resultado.success) {
            alert('Estado actualizado correctamente');
            mostrarPedidosActivos();
        } else {
            alert(`Error: ${resultado.message}`);
        }
    } else {
        mostrarPedidosActivos();
    }
}

async function mostrarHistorialEmpleado() {
    console.log('Cargando historial de pedidos...');
    const contentDiv = document.getElementById('dynamicContent');
    
    try {
        const response = await fetch(API_URL + 'empleado.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'historial'
            })
        });
        const data = await response.json();
        console.log('Historial obtenido:', data);
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const historialBtn = document.getElementById('verHistorialBtn');
        if (historialBtn) historialBtn.classList.add('active');
        
        if (!data.success || !data.pedidos || data.pedidos.length === 0) {
            contentDiv.innerHTML = `
                <div class="pedidos-activos-container">
                    <h2>Historial de Pedidos</h2>
                    <div class="empty-state-empleado">
                        <h3>No hay historial</h3>
                        <p>Aún no se han pagado o cancelado pedidos.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="pedidos-activos-container">
                <h2>Historial de Pedidos (${data.pedidos.length})</h2>
                <div class="pedidos-list">
        `;
        
        data.pedidos.forEach(pedido => {
            let productosResumen = 'Sin productos';
            if (Array.isArray(pedido.productos)) {
                productosResumen = pedido.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ');
            } else if (typeof pedido.productos === 'string') {
                productosResumen = pedido.productos;
            }
            
            const estadoClass = `estado-${pedido.estado?.toLowerCase() || 'pagado'}`;
            const total = parseFloat(pedido.total || 0);
            const numero = pedido.numero_pedido || '#BAT-' + String(pedido.id_pedido).padStart(4, '0');
            
            const colorBorde = pedido.estado === 'Pagado' ? '#2ecc71' : '#e74c3c';
            
            html += `
                <div class="pedido-card-empleado" style="border-left-color: ${colorBorde}; opacity:0.85;">
                    <div class="pedido-info">
                        <div class="numero">${numero}</div>
                        <div class="cliente">${pedido.cliente || 'Sin cliente'}</div>
                        <div class="productos">${productosResumen}</div>
                    </div>
                    <div class="pedido-total">$${total.toFixed(2)}</div>
                    <div style="text-align:center;">
                        <span class="estado-badge ${estadoClass}">${pedido.estado || 'Pagado'}</span>
                    </div>
                    <div style="font-size:0.75rem; color: #888;">
                        ${formatearFecha(pedido.fecha)}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar historial:', error);
        contentDiv.innerHTML = `
            <div class="pedidos-activos-container">
                <h2>Historial de Pedidos</h2>
                <div class="empty-state-empleado" style="color: #e74c3c;">
                    <h3>Error al cargar historial</h3>
                    <p>${error.message}</p>
                    <button onclick="mostrarHistorialEmpleado()" style="background: #2c5f2d; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer; margin-top:16px;">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
    }
}

async function mostrarFacturasEmpleado() {
    console.log('Cargando facturas del empleado...');
    const contentDiv = document.getElementById('dynamicContent');
    
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Debes iniciar sesión.');
            return;
        }
        
        const response = await fetch(API_URL + 'facturacion.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'historial_empleado',
                id_usuario: currentUser.id || 0
            })
        });
        const data = await response.json();
        console.log('Facturas obtenidas:', data);
        
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const facturasBtn = document.getElementById('verFacturasBtn');
        if (facturasBtn) facturasBtn.classList.add('active');
        
        if (!data.success || !data.facturas || data.facturas.length === 0) {
            contentDiv.innerHTML = `
                <div class="pedidos-activos-container">
                    <h2>Mis Facturas</h2>
                    <div class="empty-state-empleado">
                        <h3>No has generado facturas</h3>
                        <p>Aún no has realizado ninguna facturación.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="pedidos-activos-container">
                <h2>Mis Facturas (${data.facturas.length})</h2>
                <div class="pedidos-list">
        `;
        
        data.facturas.forEach(factura => {
            html += `
                <div class="pedido-card-empleado" style="border-left-color: #2c5f2d;">
                    <div class="pedido-info">
                        <div class="numero">${factura.numero_factura || 'N/A'}</div>
                        <div class="cliente">${factura.cliente || factura.usuario || 'Cliente'}</div>
                        <div class="productos">Pedido #${factura.id_pedido || 'N/A'}</div>
                    </div>
                    <div class="pedido-total">$${parseFloat(factura.total || 0).toFixed(2)}</div>
                    <div style="text-align:center;">
                        <span class="estado-badge estado-pagado">${factura.metodo_pago || 'Efectivo'}</span>
                    </div>
                    <div style="font-size:0.75rem; color: #888;">
                        ${formatearFecha(factura.fecha_emision || factura.fecha)}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar facturas:', error);
        contentDiv.innerHTML = `
            <div class="pedidos-activos-container">
                <h2>Mis Facturas</h2>
                <div class="empty-state-empleado" style="color: #e74c3c;">
                    <h3>Error al cargar facturas</h3>
                    <p>${error.message}</p>
                    <button onclick="mostrarFacturasEmpleado()" style="background: #2c5f2d; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer; margin-top:16px;">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
    }
}

window.mostrarPedidosActivos = mostrarPedidosActivos;
window.mostrarHistorialEmpleado = mostrarHistorialEmpleado;
window.mostrarFacturasEmpleado = mostrarFacturasEmpleado;
window.cambiarEstadoEmpleado = cambiarEstadoEmpleado;

console.log('empleado.js cargado correctamente');