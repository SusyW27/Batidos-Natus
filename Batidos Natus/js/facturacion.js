let pedidoSeleccionado = null;
let facturaGenerada = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('facturacion.js cargado');
    crearOverlay();
    
    const cerrarBtn = document.getElementById('cerrarFacturaPanel');
    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', cerrarPanelFactura);
    }
    
    const monedaPago = document.getElementById('monedaPago');
    if (monedaPago) {
        monedaPago.addEventListener('change', toggleMontoBs);
    }
});

function crearOverlay() {
    let overlay = document.getElementById('facturaOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'facturaOverlay';
        overlay.className = 'factura-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', cerrarPanelFactura);
        console.log('Overlay creado');
    }
}

function toggleMontoBs() {
    const monedaSelect = document.getElementById('monedaPago');
    const montoBsContainer = document.getElementById('montoBsContainer');
    const montoBsInput = document.getElementById('montoBs');
    
    if (!monedaSelect || !montoBsContainer) return;
    
    if (monedaSelect.value === 'Bs') {
        montoBsContainer.style.display = 'flex';
        if (montoBsInput) {
            montoBsInput.required = true;
            montoBsInput.focus();
        }
    } else {
        montoBsContainer.style.display = 'none';
        if (montoBsInput) {
            montoBsInput.required = false;
            montoBsInput.value = '';
        }
    }
}

async function abrirPanelFactura(pedidoId) {
    console.log('Abriendo panel de factura para pedido:', pedidoId);
    
    const panel = document.getElementById('facturaPanel');
    const overlay = document.getElementById('facturaOverlay');
    
    if (!panel || !overlay) {
        console.error('Panel u overlay no encontrados');
        alert('Error al abrir el panel de facturación.');
        return;
    }
    
    try {
        const pedidos = await getPedidosActivos();
        window.pedidosActivos = pedidos;
        console.log('Pedidos recargados:', pedidos.length);
    } catch (error) {
        console.warn('Error al recargar pedidos:', error);
    }
    
    const pedidosActivos = window.pedidosActivos || [];
    const pedido = pedidosActivos.find(p => parseInt(p.id_pedido) === parseInt(pedidoId));
    
    if (!pedido) {
        alert('Pedido no encontrado. Actualiza la página e intenta de nuevo.');
        console.warn('Pedido no encontrado en window.pedidosActivos');
        return;
    }
    
    const estadoNormalizado = (pedido.estado || '').charAt(0).toUpperCase() + (pedido.estado || '').slice(1).toLowerCase();
    
    if (estadoNormalizado !== 'Pendiente') {
        alert(`Este pedido ya fue procesado (${pedido.estado}). No se puede facturar.`);
        cerrarPanelFactura();
        return;
    }
    
    const tieneProductos = validarPedidoConProductos(pedido);
    if (!tieneProductos) {
        alert('Este pedido no tiene productos asociados.\n\nNo se puede generar factura. Por favor, crea un nuevo pedido desde la tienda.');
        return;
    }
    
    pedidoSeleccionado = pedido;
    
    panel.classList.add('open');
    overlay.classList.add('active');
    
    generarVistaFactura(pedido);
    
    const formPago = document.getElementById('formularioPago');
    if (formPago) formPago.style.display = 'none';
    
    const btnTarjeta = document.getElementById('btnPagarTarjeta');
    if (btnTarjeta) btnTarjeta.textContent = 'Mostrar Datos de Pago';
    
    const btnConfirmar = document.getElementById('btnConfirmarPago');
    if (btnConfirmar) btnConfirmar.style.display = 'block';
    
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.style.display = 'none';
    
    const mensajePago = document.getElementById('mensajePago');
    if (mensajePago) {
        mensajePago.style.display = 'none';
        mensajePago.className = '';
    }
    
    const montoBsContainer = document.getElementById('montoBsContainer');
    if (montoBsContainer) montoBsContainer.style.display = 'none';
}

function validarPedidoConProductos(pedido) {
    if (pedido && parseFloat(pedido.total || 0) > 0) {
        return true;
    }
    if (Array.isArray(pedido.productos) && pedido.productos.length > 0) {
        return true;
    }
    if (typeof pedido.productos === 'string' && pedido.productos.trim() !== '') {
        return true;
    }
    return false;
}

function generarVistaFactura(pedido) {
    const contenido = document.getElementById('facturaContenido');
    if (!contenido) return;
    
    const total = parseFloat(pedido.total || 0);
    const numero = pedido.numero_pedido || '#BAT-' + String(pedido.id_pedido).padStart(4, '0');
    const estado = pedido.estado || 'Pendiente';
    const estadoLower = estado.toLowerCase();
    const estadoClass = estadoLower === 'pagado' ? 'estado-pagado' : 
                        estadoLower === 'cancelado' ? 'estado-cancelado' : 'estado-pendiente';
    
    let productosHtml = '';
    const tieneProductos = validarPedidoConProductos(pedido);
    
    if (tieneProductos && Array.isArray(pedido.productos) && pedido.productos.length > 0) {
        productosHtml = pedido.productos.map((p, index) => `
            <div class="factura-item" style="animation-delay: ${index * 0.05}s">
                <span>${p.nombre || 'Producto'} x${p.cantidad || 1}</span>
                <span>$${(parseFloat(p.precio_unitario || 0) * (p.cantidad || 1)).toFixed(2)}</span>
            </div>
        `).join('');
    } else if (tieneProductos && typeof pedido.productos === 'string') {
        productosHtml = `
            <div class="factura-item">
                <span>${pedido.productos}</span>
            </div>
        `;
    } else {
        productosHtml = `
            <div class="factura-item error-productos">
                <span>
                    ERROR: Este pedido no tiene productos asociados.
                    <small>No se puede generar factura. Crea un nuevo pedido desde la tienda.</small>
                </span>
                <span>$0.00</span>
            </div>
        `;
    }
    
    contenido.innerHTML = `
        <div class="factura-header">
            <h2>Batidos-Natus</h2>
            <p>Energía natural, sabor auténtico</p>
            <hr style="border: none; border-top: 2px dashed #e0e0e0; margin: 10px 0 0 0;">
        </div>
        
        <div class="factura-datos">
            <p><strong>Cliente:</strong> ${pedido.cliente || 'Sin cliente'}</p>
            <p><strong>Pedido:</strong> ${numero}</p>
            <p><strong>Fecha:</strong> ${formatearFecha(pedido.fecha)}</p>
            <p><strong>Estado:</strong> <span class="${estadoClass}">${estado.toUpperCase()}</span></p>
            ${!tieneProductos ? `<p><strong style="color: #e74c3c;">¡PEDIDO SIN PRODUCTOS!</strong></p>` : ''}
        </div>
        
        <div class="factura-productos">
            <p>Productos</p>
            ${productosHtml}
        </div>
        
        <div class="factura-total">
            <span>TOTAL</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
}

function regenerarFacturaConEstado(pedido, data) {
    const contenido = document.getElementById('facturaContenido');
    if (!contenido) return;
    
    const tieneProductos = validarPedidoConProductos(pedido);
    if (!tieneProductos) {
        console.warn('El pedido no tiene productos en el objeto, pero continuamos...');
    }
    
    const total = parseFloat(pedido.total || 0);
    const numero = pedido.numero_pedido || '#BAT-' + String(pedido.id_pedido).padStart(4, '0');
    
    const metodoPago = document.getElementById('metodoPago')?.value || 'efectivo_bs';
    const moneda = document.getElementById('monedaPago')?.value || 'Bs';
    const montoBs = document.getElementById('montoBs')?.value || '';
    const tipoServicio = document.getElementById('tipoServicio')?.value || 'mesa';
    const tiempoAtencion = parseInt(document.getElementById('tiempoAtencion')?.value || 0);
    
    const metodoTexto = {
        'efectivo_bs': 'Efectivo Bs.',
        'efectivo_usd': 'Efectivo USD',
        'transferencia': 'Transferencia',
        'pago_movil': 'Pago Móvil',
        'tarjeta_debito': 'Tarjeta Débito',
        'tarjeta_credito': 'Tarjeta Crédito'
    };
    
    let productosHtml = '';
    if (Array.isArray(pedido.productos) && pedido.productos.length > 0) {
        productosHtml = pedido.productos.map((p, index) => `
            <div class="factura-item" style="animation-delay: ${index * 0.05}s">
                <span>${p.nombre || 'Producto'} x${p.cantidad || 1}</span>
                <span>$${(parseFloat(p.precio_unitario || 0) * (p.cantidad || 1)).toFixed(2)}</span>
            </div>
        `).join('');
    } else {
        productosHtml = `
            <div class="factura-item" style="border-left: 3px solid #f39c12; padding-left: 10px;">
                <span>Productos del pedido</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        `;
    }
    
    let montoBsHtml = '';
    if (moneda === 'Bs' && montoBs && parseFloat(montoBs) > 0) {
        montoBsHtml = `<p><strong>Monto en Bs.:</strong> ${parseFloat(montoBs).toFixed(2)} Bs.</p>`;
    }
    
    let totalHtml = `<span>$${total.toFixed(2)}</span>`;
    if (moneda === 'Bs' && montoBs && parseFloat(montoBs) > 0) {
        totalHtml = `<span>$${total.toFixed(2)} / ${parseFloat(montoBs).toFixed(2)} Bs.</span>`;
    }
    
    contenido.innerHTML = `
        <div class="factura-header">
            <h2>Batidos-Natus</h2>
            <p>Energía natural, sabor auténtico</p>
            <hr style="border: none; border-top: 2px dashed #e0e0e0; margin: 10px 0 0 0;">
        </div>
        
        <div class="factura-datos">
            <p><strong>Factura:</strong> ${data?.numero_factura || 'N/A'}</p>
            <p><strong>Cliente:</strong> ${pedido.cliente || 'Sin cliente'}</p>
            <p><strong>Pedido:</strong> ${numero}</p>
            <p><strong>Fecha:</strong> ${formatearFecha(pedido.fecha)}</p>
            <p><strong>Método:</strong> ${metodoTexto[metodoPago] || metodoPago}</p>
            <p><strong>Moneda:</strong> ${moneda}</p>
            ${montoBsHtml}
            <p><strong>Servicio:</strong> ${tipoServicio}</p>
            <p><strong>Tiempo:</strong> ${tiempoAtencion} min</p>
            <p><strong>Estado:</strong> <span class="estado-pagado">PAGADO</span></p>
        </div>
        
        <div class="factura-productos">
            <p>Productos</p>
            ${productosHtml}
        </div>
        
        <div class="factura-total">
            <span>TOTAL</span>
            ${totalHtml}
        </div>
        
        <div class="factura-exito">
            ¡Pago exitoso! - Factura generada
        </div>
    `;
}

function cerrarPanelFactura() {
    const panel = document.getElementById('facturaPanel');
    const overlay = document.getElementById('facturaOverlay');
    
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    
    pedidoSeleccionado = null;
    facturaGenerada = null;
    
    const formPago = document.getElementById('formularioPago');
    if (formPago) formPago.style.display = 'none';
    
    const btnTarjeta = document.getElementById('btnPagarTarjeta');
    if (btnTarjeta) btnTarjeta.textContent = 'Mostrar Datos de Pago';
    
    const btnConfirmar = document.getElementById('btnConfirmarPago');
    if (btnConfirmar) btnConfirmar.style.display = 'block';
    
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.style.display = 'none';
    
    const mensajePago = document.getElementById('mensajePago');
    if (mensajePago) {
        mensajePago.style.display = 'none';
        mensajePago.className = '';
    }
}

function toggleFormularioPago() {
    const formPago = document.getElementById('formularioPago');
    const btn = document.getElementById('btnPagarTarjeta');
    
    if (!formPago || !btn) return;
    
    if (formPago.style.display === 'none' || formPago.style.display === '') {
        formPago.style.display = 'block';
        btn.textContent = 'Cerrar Datos de Pago';
        toggleMontoBs();
    } else {
        formPago.style.display = 'none';
        btn.textContent = 'Mostrar Datos de Pago';
        const mensajePago = document.getElementById('mensajePago');
        if (mensajePago) {
            mensajePago.style.display = 'none';
            mensajePago.className = '';
        }
        const montoBsContainer = document.getElementById('montoBsContainer');
        if (montoBsContainer) montoBsContainer.style.display = 'none';
    }
}

async function confirmarPago() {
    if (!pedidoSeleccionado) {
        alert('No hay pedido seleccionado.');
        return;
    }
    
    const estadoNormalizado = (pedidoSeleccionado.estado || '').charAt(0).toUpperCase() + (pedidoSeleccionado.estado || '').slice(1).toLowerCase();
    
    if (estadoNormalizado !== 'Pendiente') {
        alert(`Este pedido ya fue procesado (${pedidoSeleccionado.estado}). No se puede cobrar.`);
        cerrarPanelFactura();
        return;
    }
    
    const tieneProductos = validarPedidoConProductos(pedidoSeleccionado);
    if (!tieneProductos) {
        alert('No se puede cobrar este pedido porque no tiene productos asociados.\n\nPor favor, crea un nuevo pedido desde la tienda.');
        return;
    }
    
    const metodoPago = document.getElementById('metodoPago')?.value || 'efectivo_bs';
    const moneda = document.getElementById('monedaPago')?.value || 'Bs';
    const montoBs = document.getElementById('montoBs')?.value || '';
    const tipoServicio = document.getElementById('tipoServicio')?.value || 'mesa';
    const tiempoAtencion = parseInt(document.getElementById('tiempoAtencion')?.value || 0);
    const observaciones = document.getElementById('observacionesPago')?.value || '';
    
    if (moneda === 'Bs' && (!montoBs || parseFloat(montoBs) <= 0)) {
        alert('Por favor, ingresa el monto en Bolívares (Bs.)');
        document.getElementById('montoBs')?.focus();
        return;
    }
    
    const metodoTexto = {
        'efectivo_bs': 'Efectivo Bs.',
        'efectivo_usd': 'Efectivo USD',
        'transferencia': 'Transferencia',
        'pago_movil': 'Pago Móvil',
        'tarjeta_debito': 'Tarjeta Débito',
        'tarjeta_credito': 'Tarjeta Crédito'
    };
    
    let confirmMessage = `¿Cobrar pedido ${pedidoSeleccionado.numero_pedido}?\n\n` +
                         `Total: $${parseFloat(pedidoSeleccionado.total || 0).toFixed(2)}\n` +
                         `Método: ${metodoTexto[metodoPago] || metodoPago}\n` +
                         `Moneda: ${moneda}\n`;
    
    if (moneda === 'Bs' && montoBs) {
        confirmMessage += `Monto en Bs.: ${parseFloat(montoBs).toFixed(2)} Bs.\n`;
    }
    
    confirmMessage += `Servicio: ${tipoServicio}\n` +
                      `Tiempo: ${tiempoAtencion} min\n\n` +
                      `¿Confirmar pago?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Debes iniciar sesión para realizar esta acción.');
            return;
        }
        
        const response = await fetch(API_URL + 'facturacion.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'procesar_pago_empleado',
                id_pedido: parseInt(pedidoSeleccionado.id_pedido),
                metodo_pago: metodoPago,
                moneda: moneda,
                monto_bs: montoBs,
                tipo_servicio: tipoServicio,
                tiempo_atencion: tiempoAtencion,
                observaciones: observaciones,
                creado_por: currentUser.username || 'empleado',
                id_usuario: currentUser.id || 0
            })
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            facturaGenerada = data;
            pedidoSeleccionado.estado = 'Pagado';
            
            try {
                console.log('Cargando productos del pedido desde la API...');
                const resProductos = await fetch(API_URL + 'pedidos.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'obtener',
                        id_pedido: parseInt(pedidoSeleccionado.id_pedido)
                    })
                });
                const dataProductos = await resProductos.json();
                console.log('Productos obtenidos:', dataProductos);
                
                if (dataProductos.success && dataProductos.pedido) {
                    pedidoSeleccionado.productos = dataProductos.pedido.productos || [];
                    console.log('Productos asignados:', pedidoSeleccionado.productos.length);
                }
            } catch (e) {
                console.warn('No se pudieron cargar productos:', e);
            }
            
            if (window.pedidosActivos) {
                const index = window.pedidosActivos.findIndex(p => p.id_pedido === pedidoSeleccionado.id_pedido);
                if (index !== -1) {
                    window.pedidosActivos[index].estado = 'Pagado';
                }
            }
            
            const mensajeDiv = document.getElementById('mensajePago');
            if (mensajeDiv) {
                let mensaje = `Factura ${data.numero_factura} generada. Total: $${data.total.toFixed(2)}`;
                if (moneda === 'Bs' && montoBs) {
                    mensaje += ` / ${parseFloat(montoBs).toFixed(2)} Bs.`;
                }
                mensajeDiv.textContent = mensaje;
                mensajeDiv.className = 'success';
                mensajeDiv.style.display = 'block';
            }
            
            const btnImprimir = document.getElementById('btnImprimir');
            if (btnImprimir) btnImprimir.style.display = 'block';
            
            const btnConfirmar = document.getElementById('btnConfirmarPago');
            if (btnConfirmar) btnConfirmar.style.display = 'none';
            
            const btnTarjeta = document.getElementById('btnPagarTarjeta');
            if (btnTarjeta) btnTarjeta.style.display = 'none';
            
            regenerarFacturaConEstado(pedidoSeleccionado, data);
            
            setTimeout(async () => {
                try {
                    if (typeof mostrarPedidosActivos === 'function') {
                        await mostrarPedidosActivos();
                    }
                    const pedidos = await getPedidosActivos();
                    window.pedidosActivos = pedidos;
                } catch (e) {
                    console.warn('Error al recargar pedidos:', e);
                }
            }, 500);
            
            setTimeout(() => {
                imprimirFactura();
            }, 1000);
            
        } else {
            const mensajeDiv = document.getElementById('mensajePago');
            if (mensajeDiv) {
                mensajeDiv.textContent = `Error: ${data.message || 'Error al procesar el pago'}`;
                mensajeDiv.className = 'error';
                mensajeDiv.style.display = 'block';
            }
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al confirmar pago:', error);
        const mensajeDiv = document.getElementById('mensajePago');
        if (mensajeDiv) {
            mensajeDiv.textContent = `Error de conexión: ${error.message}`;
            mensajeDiv.className = 'error';
            mensajeDiv.style.display = 'block';
        }
        alert('Error al procesar el pago. Verifica tu conexión.');
    }
}

function imprimirFactura() {
    const contenido = document.getElementById('facturaContenido');
    if (!contenido) {
        alert('No se encontró el contenido de la factura.');
        return;
    }
    
    setTimeout(() => {
        const contenidoHTML = contenido.innerHTML;
        const textoPlano = contenido.textContent || '';
        
        if (textoPlano.includes('Selecciona un pedido para facturar')) {
            alert('No hay factura para imprimir. Selecciona un pedido primero.');
            return;
        }
        
        if (textoPlano.includes('ERROR: Este pedido no tiene productos asociados') ||
            textoPlano.includes('Este pedido no tiene productos asociados')) {
            if (!confirm('La factura no muestra productos. ¿Deseas imprimir de todas formas?')) {
                return;
            }
        }
        
        const ventana = window.open('', '_blank', 'width=600,height=800');
        if (!ventana) {
            alert('No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.');
            return;
        }
        
        const numeroFactura = facturaGenerada?.numero_factura || 'N/A';
        
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Factura ${numeroFactura}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    body { 
                        font-family: 'Courier New', monospace; 
                        padding: 25px; 
                        max-width: 500px; 
                        margin: auto; 
                        background: white;
                        color: #333;
                    }
                    
                    .factura-header {
                        text-align: center;
                        padding-bottom: 14px;
                        border-bottom: 2px dashed #e0e0e0;
                        margin-bottom: 14px;
                    }
                    
                    .factura-header h2 {
                        color: #2c5f2d;
                        margin: 0;
                        font-size: 1.6rem;
                    }
                    
                    .factura-header p {
                        color: #888;
                        font-size: 0.8rem;
                        margin: 2px 0 0 0;
                    }
                    
                    .factura-datos {
                        background: #f9f9f9;
                        padding: 12px 16px;
                        margin-bottom: 14px;
                        border: 1px solid #eee;
                        border-radius: 6px;
                    }
                    
                    .factura-datos p {
                        margin: 3px 0;
                        font-size: 0.88rem;
                    }
                    
                    .factura-datos strong {
                        display: inline-block;
                        min-width: 100px;
                    }
                    
                    .factura-productos {
                        background: #f9f9f9;
                        padding: 12px 16px;
                        margin-bottom: 12px;
                        border: 1px solid #eee;
                        border-radius: 6px;
                    }
                    
                    .factura-productos > p {
                        font-weight: bold;
                        margin: 0 0 8px 0;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 6px;
                    }
                    
                    .factura-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 0.88rem;
                    }
                    
                    .factura-item:last-child {
                        border-bottom: none;
                    }
                    
                    .factura-item span:last-child {
                        font-weight: bold;
                        color: #2c5f2d;
                    }
                    
                    .factura-item.error-productos {
                        background: #fef0f0 !important;
                        border-left: 4px solid #e74c3c !important;
                        padding: 10px !important;
                        border-radius: 4px !important;
                        color: #c0392b !important;
                    }
                    
                    .factura-item.error-productos small {
                        display: block;
                        color: #888;
                        font-size: 0.7rem;
                        margin-top: 2px;
                    }
                    
                    .factura-total {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                        font-size: 1.2rem;
                        border-top: 3px solid #2c5f2d;
                        padding-top: 12px;
                        margin-top: 12px;
                    }
                    
                    .factura-total span:last-child {
                        color: #2c5f2d;
                    }
                    
                    .factura-exito {
                        background: #e8f5e9;
                        padding: 10px;
                        border-radius: 6px;
                        text-align: center;
                        font-weight: bold;
                        color: #2e7d32;
                        border: 2px solid #4CAF50;
                        margin: 12px 0 6px 0;
                        font-size: 0.9rem;
                    }
                    
                    .estado-pagado { color: #2ecc71; font-weight: bold; }
                    .estado-pendiente { color: #f39c12; font-weight: bold; }
                    .estado-cancelado { color: #e74c3c; font-weight: bold; }
                    
                    .footer {
                        text-align: center;
                        margin-top: 16px;
                        font-size: 0.75rem;
                        color: #888;
                        border-top: 1px solid #ddd;
                        padding-top: 8px;
                    }
                </style>
            </head>
            <body>
                ${contenidoHTML}
                <div class="footer">¡Gracias por tu compra! - ${new Date().toLocaleString()}</div>
                <script>
                    window.onload = function() { 
                        setTimeout(function() {
                            window.print(); 
                        }, 400);
                    }
                <\/script>
            </body>
            </html>
        `);
        ventana.document.close();
        
    }, 300);
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

window.abrirPanelFactura = abrirPanelFactura;
window.cerrarPanelFactura = cerrarPanelFactura;
window.confirmarPago = confirmarPago;
window.imprimirFactura = imprimirFactura;
window.toggleFormularioPago = toggleFormularioPago;
window.toggleMontoBs = toggleMontoBs;

console.log('facturacion.js cargado correctamente');