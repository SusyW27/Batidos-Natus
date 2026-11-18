let productosStockBajo = [];
async function verificarStockBajo() {
    console.log('Verificando stock bajo...');
    
    try {
        const response = await fetch(API_URL + 'stock_alerta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'contar_stock_bajo',
                limite: 5
            })
        });
        const data = await response.json();
        console.log('Stock bajo:', data);
        
        if (data.success) {
            const total = data.total || 0;
            actualizarBadgeStock(total);
            
            if (total > 0) {
                cargarProductosStockBajo();
            }
        }
    } catch (error) {
        console.error('Error al verificar stock bajo:', error);
    }
}
async function cargarProductosStockBajo() {
    try {
        const response = await fetch(API_URL + 'stock_alerta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'stock_bajo',
                limite: 5
            })
        });
        const data = await response.json();
        
        if (data.success && data.productos) {
            productosStockBajo = data.productos;
            console.log('Productos con stock bajo:', productosStockBajo);
        }
    } catch (error) {
        console.error('Error al cargar productos con stock bajo:', error);
    }
}
function actualizarBadgeStock(total) {
    const badge = document.getElementById('stockBadge');
    const container = document.getElementById('stockAlertaContainer');
    const btn = document.getElementById('stockAlertaBtn');
    
    if (!badge || !container || !btn) return;
    
    if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'inline-flex';
        container.style.display = 'inline-block';
        badge.className = 'stock-badge-bubble';
        if (total >= 5) {
            badge.classList.add('alto');
        } else if (total >= 2) {
            badge.classList.add('medio');
        } else {
            badge.classList.add('critico');
        }
    } else {
        badge.style.display = 'none';
        container.style.display = 'none';
    }
}
function mostrarModalStockBajo() {
    const modal = document.getElementById('stockModal');
    const body = document.getElementById('stockModalBody');
    
    if (!modal || !body) return;
    body.innerHTML = `
        <div class="stock-loading">
            <div class="spinner"></div>
            <p style="margin-top:10px;">Cargando productos...</p>
        </div>
    `;
    
    modal.style.display = 'flex';
    cargarProductosStockBajo().then(() => {
        renderModalStock();
    });
}
function renderModalStock() {
    const body = document.getElementById('stockModalBody');
    const count = document.getElementById('stockModalCount');
    
    if (!body) return;
    
    if (productosStockBajo.length === 0) {
        body.innerHTML = `
            <div class="stock-empty-state">
                <p>Todos los productos tienen stock suficiente.</p>
            </div>
        `;
        if (count) count.textContent = '0';
    } else {
        if (count) count.textContent = productosStockBajo.length;
        
        let html = `
            <div style="margin-bottom:10px; color: #666; font-size:0.9rem; padding:0 5px;">
                Estos productos tienen stock bajo (≤ 5 unidades):
            </div>
        `;
        
        productosStockBajo.forEach((producto) => {
            const stock = producto.stock;
            let clase = 'bajo';
            let icono = '⚠';
            
            if (stock === 0) {
                clase = 'agotado';
                icono = '✖';
            } else if (stock <= 2) {
                clase = 'critico';
                icono = '⨻';
            } else {
                clase = 'bajo';
                icono = '⚠';
            }
            
            html += `
                <div class="stock-item">
                    <div class="producto-info">
                        <span class="producto-nombre">${producto.nombre}</span>
                        <span class="producto-id">ID: #${producto.id}</span>
                    </div>
                    <div class="producto-stock">
                        <span class="stock-icon">${icono}</span>
                        <span class="stock-badge-cantidad ${clase}">${stock} uds.</span>
                    </div>
                </div>
            `;
        });
        
        html += `
            <a href="inventory.html" class="stock-link-inventario">
                Ir al inventario para reponer stock
            </a>
        `;
        
        body.innerHTML = html;
    }
}
function cerrarModalStock() {
    document.getElementById('stockModal').style.display = 'none';
}

function initStockAlerta() {
    console.log('Inicializando alerta de stock...');
    verificarStockBajo();
    const alertaBtn = document.getElementById('stockAlertaBtn');
    if (alertaBtn) {
        alertaBtn.addEventListener('click', mostrarModalStockBajo);
    }
    const modal = document.getElementById('stockModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalStock();
            }
        });
    }
    setInterval(verificarStockBajo, 60000);
}

window.initStockAlerta = initStockAlerta;
window.verificarStockBajo = verificarStockBajo;
window.mostrarModalStockBajo = mostrarModalStockBajo;
window.cerrarModalStock = cerrarModalStock;

console.log('admin-stock-alerta.js cargado correctamente');