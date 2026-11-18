async function crearPedido(usuario, carrito, total) {
    try {
        console.log('Enviando pedido...');
        console.log('Usuario:', usuario);
        console.log('Carrito:', carrito);
        console.log('Total:', total);
        
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Debes iniciar sesión' };
        }
        
        const userId = currentUser.id || 0;
        console.log('ID del usuario:', userId);
        
        const url = API_URL + 'pedidos.php';
        console.log('URL de la API:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'guardar',
                id_usuario: userId,
                productos: carrito,
                total: total,
                observaciones: ''
            })
        });
        
        console.log('Status de respuesta:', response.status);
        
        const text = await response.text();
        console.log('Respuesta:', text);
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Error al parsear JSON:', e);
            return { 
                success: false, 
                message: 'El servidor devolvió una respuesta inválida: ' + text.substring(0, 100) 
            };
        }
        
        return data;
        
    } catch (error) {
        console.error('Error al guardar pedido:', error);
        return { 
            success: false, 
            message: 'Error de conexión con el servidor: ' + error.message 
        };
    }
}

async function getPedidosByUser(username) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return [];
        
        const userId = currentUser.id || 0;
        
        const response = await fetch(API_URL + 'pedidos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'listar',
                id_usuario: userId
            })
        });
        const data = await response.json();
        return data.success ? data.pedidos : [];
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        return [];
    }
}

async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
    try {
        const estadoNormalizado = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1).toLowerCase();
        const response = await fetch(API_URL + 'pedidos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'cambiar_estado',
                id_pedido: pedidoId,
                estado: estadoNormalizado
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

async function getPedidosActivos() {
    try {
        const response = await fetch(API_URL + 'empleado.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'pedidos_activos'
            })
        });
        const data = await response.json();
        console.log('Datos de pedidos activos:', data);
        
        if (data.success && data.pedidos) {
            data.pedidos = data.pedidos.map(p => {
                if (p.estado) {
                    p.estado = p.estado.charAt(0).toUpperCase() + p.estado.slice(1).toLowerCase();
                }
                return p;
            });
            return data.pedidos;
        }
        return [];
    } catch (error) {
        console.error('Error al obtener pedidos activos:', error);
        return [];
    }
}

async function getEstadisticasPedidos() {
    try {
        const response = await fetch(API_URL + 'empleado.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'estadisticas'
            })
        });
        const data = await response.json();
        return data.success ? data.estadisticas : {
            totalPedidos: 0,
            totalVentas: 0,
            porEstado: {
                Pendiente: 0,
                Pagado: 0,
                Cancelado: 0
            }
        };
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return {
            totalPedidos: 0,
            totalVentas: 0,
            porEstado: {
                Pendiente: 0,
                Pagado: 0,
                Cancelado: 0
            }
        };
    }
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

function getPedidos() {
    return JSON.parse(localStorage.getItem('pedidos')) || [];
}

function savePedidos(pedidos) {
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
}

function generarNumeroPedido() {
    const pedidos = getPedidos();
    const siguienteId = pedidos.length + 1;
    return `#BAT-${String(siguienteId).padStart(4, '0')}`;
}

window.crearPedido = crearPedido;
window.getPedidosByUser = getPedidosByUser;
window.actualizarEstadoPedido = actualizarEstadoPedido;
window.getPedidos = getPedidos;
window.savePedidos = savePedidos;
window.generarNumeroPedido = generarNumeroPedido;
window.formatearFecha = formatearFecha;
window.getEstadisticasPedidos = getEstadisticasPedidos;
window.getPedidosActivos = getPedidosActivos;

console.log('orders.js cargado con conexión a API');