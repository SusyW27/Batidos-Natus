const CART_PREFIX = 'cart_';

function getCart() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const cartKey = CART_PREFIX + currentUser.username;
    const cart = localStorage.getItem(cartKey);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const cartKey = CART_PREFIX + currentUser.username;
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

function addToCart(product) {
    if (!product.id || product.id === 0) {
        console.error('Producto sin ID válido:', product);
        alert('Error: No se puede agregar el producto');
        return;
    }
    
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    let message = '';
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
        message = `✔ ${product.name} - Cantidad aumentada a ${cart[existingIndex].quantity}`;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image || 'img/default.jpg'
        });
        message = `✔ ${product.name} añadido al carrito`;
    }
    
    saveCart(cart);
    showToast(message);
    renderShopView();
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    renderShopView();
}

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

function calculateTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
}

function clearCart() {
    saveCart([]);
    renderShopView();
}

function showToast(message, type = 'success') {
    const existingNotification = document.querySelector('.notification-card');
    if (existingNotification) existingNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification-card';

    let cleanMessage = message.replace('✔ ', '').replace('✓ ', '');
    
    notification.innerHTML = `
        <div class="notification-header" style="background: linear-gradient(135deg, #2c5f2d, #4CAF50); color:white; padding:12px 18px; border-radius:12px 12px 0 0; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600;">Batidos-Natus</span>
            <span style="background:rgba(255,255,255,0.2); padding:2px 10px; border-radius:20px; font-size:0.8rem;">✓</span>
        </div>
        <div class="notification-body" style="display:flex; align-items:center; gap:12px; padding:15px 18px; background: #fafafa;">
            <div class="notification-icon" style="flex-shrink:0;">
                <img src="img/logo3.png" alt="Batido" style="width: 60px; height: 60px; object-fit: contain; border-radius:50%; border:2px solid #2c5f2d;">
            </div>
            <div class="notification-info">
                <h4 style="margin:0 0 4px 0; color:#2c5f2d; font-size:1rem;">${cleanMessage}</h4>
                <p style="margin:0; color:#666; font-size:0.9rem;">Tu pedido se actualizó correctamente</p>
            </div>
        </div>
        <div class="notification-footer" style="padding:8px 18px; background: #f0f0f0; color: #888; font-size:0.75rem; text-align:center; border-top:1px solid #ddd; border-radius:0 0 12px 12px;">
            Energía natural, sabor auténtico
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification && notification.remove) notification.remove();
    }, 3000);
}

window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.calculateTotal = calculateTotal;
window.clearCart = clearCart;
window.showToast = showToast;

console.log('cart.js cargado correctamente');