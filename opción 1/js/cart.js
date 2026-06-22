// ========== GESTIÓN DEL CARRITO ==========

// Obtener carrito del usuario actual
function getCart() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const cartKey = DB_KEYS.CART_PREFIX + currentUser;
    const cart = localStorage.getItem(cartKey);
    return cart ? JSON.parse(cart) : [];
}

// Guardar carrito
function saveCart(cart) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const cartKey = DB_KEYS.CART_PREFIX + currentUser;
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

// Agregar producto al carrito
function addToCart(product) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    let message = '';
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
        message = `✔ ${product.name} - Cantidad aumentada a ${cart[existingIndex].quantity}`;
    } else {
        cart.push({ ...product, quantity: 1 });
        message = `✔ ${product.name} añadido al carrito`;
    }
    
    saveCart(cart);
    showToast(message); //Mensaje de confirmación
    renderShopView(); // Refrescar vista
}

// Eliminar item del carrito
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    renderShopView();
}

// Actualizar cantidad de un producto
function updateQuantity(productId, delta) {
    let cart = getCart();
    const index = cart.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        const newQty = cart[index].quantity + delta;
        if (newQty <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = newQty;
        }
        saveCart(cart);
        renderShopView();
    }
}

// Calcular total del carrito
function calculateTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
}

// Vaciar carrito
function clearCart() {
    saveCart([]);
    renderShopView();
}

// Notificación temporal de confirmación
function showToast(message, type = 'success') {
    const existingNotification = document.querySelector('.notification-card');
    if (existingNotification) existingNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification-card';
    
    // Limpiar el mensaje (quitar el check ✓)
    let cleanMessage = message.replace('✓ ', '');
    
    notification.innerHTML = `
        <div class="notification-header">
            <span>🛒 Batidos-Natus</span>
            <span class="notification-price">✓</span>
        </div>
        <div class="notification-body">
            <div class="notification-icon">
            <img src="img/logo3.png" alt="Batido" style="width: 80px; height: 80px; object-fit: contain;">
            </div>
            <div class="notification-info">
                <h4>${cleanMessage}</h4>
                <p>Tu pedido se actualizó correctamente</p>
            </div>
        </div>
        <div class="notification-footer">
            Energía natural, sabor auténtico
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification && notification.remove) notification.remove();
    }, 3000);
}