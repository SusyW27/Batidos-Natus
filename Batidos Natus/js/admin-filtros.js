let pedidosFiltrados = [];
let clientesList = [];

function initFiltros() {
    console.log('Inicializando filtros...');
    
    const buscarBtn = document.getElementById('buscarFiltrosBtn');
    if (buscarBtn) {
        buscarBtn.addEventListener('click', aplicarFiltros);
    }
    
    const limpiarBtn = document.getElementById('limpiarFiltrosBtn');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarFiltros);
    }
    
    const inputs = document.querySelectorAll('.filtro-input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                aplicarFiltros();
            }
        });
    });
    
    cargarClientes();
}

async function cargarClientes() {
    try {
        const response = await fetch(API_URL + 'pedidos_filtro.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'clientes'
            })
        });
        const data = await response.json();
        if (data.success && data.clientes) {
            clientesList = data.clientes;
            console.log('Clientes cargados:', clientesList.length);
        }
    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
}

async function aplicarFiltros() {
    console.log('Aplicando filtros...');
    
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value || '';
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value || '';
    const estado = document.getElementById('filtroEstado')?.value || '';
    const cliente = document.getElementById('filtroCliente')?.value || '';
    const numeroPedido = document.getElementById('filtroNumero')?.value || '';
    
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
        alert('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
        return;
    }
    
    const tbody = document.getElementById('pedidosBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">
            <div class="spinner"></div>
            <p style="color:#888; margin-top:10px;">Buscando pedidos...</p>
        </td></tr>`;
    }
    
    try {
        const response = await fetch(API_URL + 'pedidos_filtro.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'buscar',
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
                estado: estado,
                cliente: cliente,
                numero_pedido: numeroPedido
            })
        });
        const data = await response.json();
        console.log('Pedidos filtrados:', data);
        
        if (data.success) {
            pedidosFiltrados = data.pedidos || [];
            renderPedidosFiltrados(pedidosFiltrados, data.total);
        } else {
            alert('Error al buscar pedidos: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        alert('Error de conexión al buscar pedidos');
    }
}

function renderPedidosFiltrados(pedidos, total) {
    const tbody = document.getElementById('pedidosBody');
    if (!tbody) return;
    
    const contador = document.getElementById('resultadosContador');
    if (contador) {
        contador.textContent = `Mostrando ${pedidos.length} pedidos`;
        contador.style.display = 'block';
    }
    
    if (pedidos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-message">
            No hay pedidos que coincidan con los filtros
        </td></tr>`;
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
}

function limpiarFiltros() {
    console.log('Limpiando filtros...');
    
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroNumero').value = '';
    
    const contador = document.getElementById('resultadosContador');
    if (contador) {
        contador.style.display = 'none';
    }
    
    if (typeof renderPedidos === 'function') {
        renderPedidos();
    } else {
        location.reload();
    }
}

function mostrarSugerenciasCliente() {
    const input = document.getElementById('filtroCliente');
    const valor = input.value.toLowerCase();
    
    if (!valor || valor.length < 2) {
        ocultarSugerencias();
        return;
    }
    
    const sugerencias = clientesList.filter(c => 
        c.toLowerCase().includes(valor)
    );
    
    if (sugerencias.length === 0) {
        ocultarSugerencias();
        return;
    }
    
    let container = document.getElementById('sugerenciasContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sugerenciasContainer';
        container.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            max-height: 150px;
            overflow-y: auto;
            z-index: 1000;
            width: 100%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(container);
    }
    
    container.innerHTML = sugerencias.map(c => `
        <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0;"
             onmouseover="this.style.background='#f0f7f0'"
             onmouseout="this.style.background='white'"
             onclick="seleccionarCliente('${c}')">
            ${c}
        </div>
    `).join('');
    container.style.display = 'block';
}

function ocultarSugerencias() {
    const container = document.getElementById('sugerenciasContainer');
    if (container) {
        container.style.display = 'none';
    }
}

function seleccionarCliente(cliente) {
    document.getElementById('filtroCliente').value = cliente;
    ocultarSugerencias();
    aplicarFiltros();
}

window.initFiltros = initFiltros;
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;
window.mostrarSugerenciasCliente = mostrarSugerenciasCliente;
window.ocultarSugerencias = ocultarSugerencias;
window.seleccionarCliente = seleccionarCliente;

console.log('admin-filtros.js cargado correctamente');