// ========== GESTIÓN DE PEDIDOS ==========
// Archivo: orders.js

// ===== IMPORTAR INVENTARIO =====
// Asegurarnos que inventoryManager esté disponible
// Si no existe, creamos una referencia global
if (typeof inventoryManager === 'undefined') {
    console.warn('⚠️ inventoryManager no disponible, creando instancia...');
    // Crear una instancia básica si no existe
    class TempInventoryManager {
        constructor() {
            this.products = JSON.parse(localStorage.getItem('inventory_products')) || [];
        }
        getProductById(id) {
            return this.products.find(p => p.id === id);
        }
        updateStock(id, cantidad) {
            const product = this.getProductById(id);
            if (product) {
                product.stock += cantidad;
                if (product.stock < 0) product.stock = 0;
                localStorage.setItem('inventory_products', JSON.stringify(this.products));
                return product;
            }
            return null;
        }
        saveProducts() {
            localStorage.setItem('inventory_products', JSON.stringify(this.products));
        }
    }
    // @ts-ignore
    window.inventoryManager = new TempInventoryManager();
}

// Obtener todos los pedidos
function getPedidos() {
    try {
        return JSON.parse(localStorage.getItem('pedidos')) || [];
    } catch (e) {
        console.error('Error al leer pedidos:', e);
        return [];
    }
}

// Guardar pedidos
function savePedidos(pedidos) {
    try {
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
    } catch (e) {
        console.error('Error al guardar pedidos:', e);
    }
}

// Generar número de pedido único
function generarNumeroPedido() {
    const pedidos = getPedidos();
    const siguienteId = pedidos.length + 1;
    return `#BAT-${String(siguienteId).padStart(4, '0')}`;
}

// Obtener pedidos de un usuario específico
function getPedidosByUser(username) {
    const pedidos = getPedidos();
    return pedidos.filter(p => p.usuario === username);
}

// Formatear fecha
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

// ===== VERIFICAR STOCK DISPONIBLE =====
function verificarStock(carrito) {
    const productosSinStock = [];
    const productosStockBajo = [];
    
    for (const item of carrito) {
        const producto = inventoryManager.getProductById(item.id);
        
        if (!producto) {
            productosSinStock.push({
                nombre: item.name || 'Producto desconocido',
                disponible: 0,
                solicitado: item.quantity || 1
            });
            continue;
        }
        
        if (producto.stock < item.quantity) {
            productosSinStock.push({
                nombre: producto.nombre,
                disponible: producto.stock,
                solicitado: item.quantity
            });
        } else if (producto.stock <= producto.stockMinimo * 2) {
            // Alerta de stock bajo pero aún suficiente
            productosStockBajo.push({
                nombre: producto.nombre,
                disponible: producto.stock,
                minimo: producto.stockMinimo
            });
        }
    }
    
    return {
        disponible: productosSinStock.length === 0,
        productosSinStock,
        productosStockBajo
    };
}

// ===== CREAR PEDIDO CON VERIFICACIÓN DE STOCK =====
function crearPedido(usuario, carrito, total) {
    console.log('🔄 crearPedido ejecutándose...');
    console.log('Usuario:', usuario);
    console.log('Carrito:', carrito);
    console.log('Total:', total);
    
    // Validar que haya productos
    if (!carrito || carrito.length === 0) {
        return { 
            success: false, 
            message: '❌ El carrito está vacío' 
        };
    }

    // Validar que el usuario existe
    if (!usuario) {
        return { 
            success: false, 
            message: '❌ Debes iniciar sesión' 
        };
    }

    // ===== VERIFICAR STOCK =====
    const stockCheck = verificarStock(carrito);
    
    if (!stockCheck.disponible) {
        const mensaje = stockCheck.productosSinStock.map(p => 
            `"${p.nombre}": solicitado ${p.solicitado}, disponible ${p.disponible}`
        ).join('\n');
        return {
            success: false,
            message: `❌ Productos sin stock suficiente:\n${mensaje}`,
            productosSinStock: stockCheck.productosSinStock
        };
    }

    // ===== DESCONTAR STOCK =====
    const productosDescontados = [];
    const errores = [];
    
    for (const item of carrito) {
        try {
            const productoActualizado = inventoryManager.updateStock(item.id, -item.quantity);
            if (productoActualizado) {
                productosDescontados.push({
                    nombre: productoActualizado.nombre,
                    stockRestante: productoActualizado.stock
                });
            } else {
                errores.push(`No se pudo actualizar stock para ${item.name}`);
            }
        } catch (e) {
            errores.push(`Error al actualizar ${item.name}: ${e.message}`);
        }
    }

    if (errores.length > 0) {
        // Revertir cambios si hay errores
        for (const item of productosDescontados) {
            inventoryManager.updateStock(item.id, item.cantidad || 0);
        }
        return {
            success: false,
            message: `❌ Error al descontar stock:\n${errores.join('\n')}`,
            errores
        };
    }

    // ===== CREAR PEDIDO =====
    const nuevoPedido = {
        id: Date.now(),
        numero: generarNumeroPedido(),
        usuario: usuario,
        productos: carrito.map(item => ({
            id: item.id,
            nombre: item.name || item.nombre || 'Producto',
            cantidad: item.quantity || item.cantidad || 1,
            precio: item.price || item.precio || 0,
            // Guardar stock después del pedido
            stockDisponible: inventoryManager.getProductById(item.id)?.stock || 0
        })),
        total: total,
        fecha: new Date().toISOString(),
        estado: 'Pendiente'
    };

    console.log('📦 Nuevo pedido creado:', nuevoPedido);

    // Guardar en localStorage
    const pedidos = getPedidos();
    pedidos.push(nuevoPedido);
    savePedidos(pedidos);

    // ===== NOTIFICAR STOCK BAJO (si aplica) =====
    if (stockCheck.productosStockBajo.length > 0) {
        const mensajeStockBajo = stockCheck.productosStockBajo.map(p => 
            `"${p.nombre}" tiene ${p.disponible} unidades (mínimo: ${p.minimo})`
        ).join('\n');
        console.warn('⚠️ Stock bajo detectado:\n', mensajeStockBajo);
        // Podemos guardar esta alerta para mostrarla después
        localStorage.setItem('alertas_stock_bajo', JSON.stringify(stockCheck.productosStockBajo));
    }

    return { 
        success: true, 
        message: `✅ Pedido ${nuevoPedido.numero} confirmado`,
        pedido: nuevoPedido,
        stockActualizado: productosDescontados,
        alertasStock: stockCheck.productosStockBajo
    };
}

// ===== OBTENER PRODUCTOS MÁS VENDIDOS =====
function getProductosMasVendidos(limite = 5) {
    const pedidos = getPedidos();
    const ventas = {};
    
    for (const pedido of pedidos) {
        for (const producto of pedido.productos) {
            const key = producto.id || producto.nombre;
            if (!ventas[key]) {
                ventas[key] = {
                    nombre: producto.nombre,
                    cantidad: 0,
                    totalVentas: 0
                };
            }
            ventas[key].cantidad += producto.cantidad;
            ventas[key].totalVentas += (producto.cantidad * producto.precio);
        }
    }
    
    return Object.values(ventas)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, limite);
}

// ===== OBTENER PEDIDOS CON DETALLES DE STOCK =====
function getPedidosConDetalles() {
    const pedidos = getPedidos();
    return pedidos.map(pedido => ({
        ...pedido,
        productos: pedido.productos.map(p => {
            const productoActual = inventoryManager.getProductById(p.id);
            return {
                ...p,
                stockActual: productoActual ? productoActual.stock : 0,
                stockMinimo: productoActual ? productoActual.stockMinimo : 0
            };
        })
    }));
}

// Cambiar estado de un pedido (para el admin)
function actualizarEstadoPedido(pedidoId, nuevoEstado) {
    const pedidos = getPedidos();
    const index = pedidos.findIndex(p => p.id === pedidoId);
    
    if (index === -1) {
        return { success: false, message: '❌ Pedido no encontrado' };
    }

    const estadosValidos = ['Pendiente', 'Preparando', 'Enviado', 'Entregado'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return { success: false, message: '❌ Estado no válido' };
    }

    pedidos[index].estado = nuevoEstado;
    savePedidos(pedidos);
    
    return { success: true, message: '✅ Estado actualizado' };
}

// Obtener estadísticas de pedidos (para el admin)
function getEstadisticasPedidos() {
    const pedidos = getPedidos();
    const totalPedidos = pedidos.length;
    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    
    const porEstado = {
        Pendiente: pedidos.filter(p => p.estado === 'Pendiente').length,
        Preparando: pedidos.filter(p => p.estado === 'Preparando').length,
        Enviado: pedidos.filter(p => p.estado === 'Enviado').length,
        Entregado: pedidos.filter(p => p.estado === 'Entregado').length
    };

    // Calcular productos más vendidos
    const productosMasVendidos = getProductosMasVendidos(5);

    return {
        totalPedidos,
        totalVentas,
        porEstado,
        productosMasVendidos
    };
}

// ===== REVERTIR STOCK (para cancelar pedido) =====
function revertirStockPedido(pedidoId) {
    const pedidos = getPedidos();
    const index = pedidos.findIndex(p => p.id === pedidoId);
    
    if (index === -1) {
        return { success: false, message: '❌ Pedido no encontrado' };
    }
    
    const pedido = pedidos[index];
    
    // Solo permitir revertir si está Pendiente o Preparando
    if (!['Pendiente', 'Preparando'].includes(pedido.estado)) {
        return { 
            success: false, 
            message: '❌ No se puede revertir stock para este estado' 
        };
    }
    
    // Revertir stock
    for (const producto of pedido.productos) {
        inventoryManager.updateStock(producto.id, producto.cantidad);
    }
    
    // Actualizar estado
    pedido.estado = 'Cancelado';
    savePedidos(pedidos);
    
    return { 
        success: true, 
        message: '✅ Stock revertido y pedido cancelado' 
    };
}

// ===== EXPORTAR FUNCIONES =====
window.getPedidos = getPedidos;
window.savePedidos = savePedidos;
window.generarNumeroPedido = generarNumeroPedido;
window.getPedidosByUser = getPedidosByUser;
window.formatearFecha = formatearFecha;
window.crearPedido = crearPedido;
window.actualizarEstadoPedido = actualizarEstadoPedido;
window.getEstadisticasPedidos = getEstadisticasPedidos;
window.verificarStock = verificarStock;
window.getProductosMasVendidos = getProductosMasVendidos;
window.getPedidosConDetalles = getPedidosConDetalles;
window.revertirStockPedido = revertirStockPedido;

console.log('✅ orders.js cargado correctamente con integración de inventario');