// ========== CATÁLOGO DE PRODUCTOS ==========

const productsCatalog = [
    { 
        id: 1, 
        name: "Frutas del Bosque", 
        price: 4.50, 
        description: "Arándanos, frambuesas, moras y yogurt natural.",
        image: "img/frutas-del-bosque.jpg", 
    },
    { 
        id: 2, 
        name: "Mango Pasión", 
        price: 4.20, 
        description: "Mango maduro, maracuyá y un toque de miel.",
        image: "img/mango-pasion.jpg",
    },
    { 
        id: 3, 
        name: "Verde Detox", 
        price: 5.00, 
        description: "Espinacas, manzana verde, pepino, jengibre y limón.",
        image: "img/verde-detox.jpg",
    },
    { 
        id: 4, 
        name: "Coco Playa", 
        price: 4.80, 
        description: "Agua de coco, pulpa de coco, piña y ralladura de coco.",
        image: "img/coco-playa.jpg",
    },
    { 
        id: 5, 
        name: "Proteína Energía", 
        price: 5.50, 
        description: "Banana, avena, proteína vegana y almendras.",
        image: "img/proteina-energia.jpg",
    },
    { 
        id: 6, 
        name: "Tropical Sunrise", 
        price: 4.90, 
        description: "Naranja, zanahoria, jengibre y cúrcuma.",
        image: "img/tropical-sunrise.jpg",
    }
];

// Renderizar productos en el dashboard
function renderProducts() {
    let productsHtml = `<h2>🍹 Nuestros Batidos Naturales</h2>
                        <div class="products-grid">`;
    
    productsCatalog.forEach(product => {
        productsHtml += `
            <div class="product-card">
                <div class="product-img" style="background: url('${product.image}'); background-size: cover, background-position: center;">
                    <span class="badge-natural">100% Natural</span>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="price">$${product.price.toFixed(2)}</div>
                    <div class="desc">${product.description}</div>
                    <button class="add-btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                        ➕ Agregar Pedido
                    </button>
                </div>
            </div>
        `;
    });
    
    productsHtml += `</div>`;
    return productsHtml;
}

// Renderizar carrito
function renderCart() {
    const currentUser = getCurrentUsername();
    const cart = getCart();
    const total = calculateTotal();
    
    let cartHtml = `<div class="cart-summary">
                        <div class="cart-title">
                            <span>🛒 Tu Pedido</span>
                            <span style="font-size:0.8rem;">${currentUser}</span>
                        </div>`;
    
    if (cart.length === 0) {
        cartHtml += `<div class="empty-cart">Aún no has agregado batidos. ¡Pide tu favorito!</div>`;
    } else {
        cartHtml += `<ul class="cart-items">`;
        cart.forEach(item => {
            cartHtml += `
                <li>
                    <div><strong>${item.name}</strong> x${item.quantity}</div>
                    <div>
                        $${(item.price * item.quantity).toFixed(2)}
                        <button class="btn-qty" data-id="${item.id}" data-delta="-1">-</button>
                        <button class="btn-qty" data-id="${item.id}" data-delta="1" style="background:#2c5f2d; color:white;">+</button>
                        <button class="btn-remove" data-id="${item.id}">✖</button>
                    </div>
                </li>
            `;
        });
        cartHtml += `</ul><div class="total">Total: $${total}</div>`;
    }
    
    cartHtml += `<div style="margin-top:1rem; text-align:right;">
                    <button id="checkoutBtn" style="background:#e67e22; border:none; padding:0.6rem 1.2rem; border-radius:40px; color:white; font-weight:bold; cursor:pointer;">
                        ✅ Finalizar Pedido
                    </button>
                 </div>`;
    cartHtml += `</div>`;
    
    return cartHtml;
}

// Renderizar vista completa de la tienda
function renderShopView() {
    const contentDiv = document.getElementById("dynamicContent");
    if (!contentDiv) return;
    
    const productsHtml = renderProducts();
    const cartHtml = renderCart();
    
    contentDiv.innerHTML = productsHtml + cartHtml;
    
    // Agregar event listeners a los botones
    attachProductEvents();
    attachCartEvents();
}

// Eventos de productos
function attachProductEvents() {
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            addToCart({ id, name, price });
        });
    });
}

// Eventos del carrito
function attachCartEvents() {
    document.querySelectorAll('.btn-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const delta = parseInt(btn.dataset.delta);
            updateQuantity(id, delta);
        });
    });
    
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
        });
    });

    // ===== BOTÓN FINALIZAR PEDIDO (CON DELEGACIÓN) =====
    // Eliminar eventos anteriores del checkoutBtn para evitar duplicados
    const oldCheckoutBtn = document.getElementById('checkoutBtn');
    if (oldCheckoutBtn) {
        const newCheckoutBtn = oldCheckoutBtn.cloneNode(true);
        oldCheckoutBtn.parentNode.replaceChild(newCheckoutBtn, oldCheckoutBtn);
    }

    // Agregar evento al nuevo botón
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔄 Botón Finalizar Pedido clickeado');
            
            const cart = getCart();
            console.log('Carrito:', cart);
            
            if (cart.length === 0) {
                alert("🛒 Tu carrito está vacío. Agrega algún batido.");
                return;
            }

            const currentUser = getCurrentUser();
            console.log('Usuario:', currentUser);
            
            if (!currentUser) {
                alert("⚠️ Debes iniciar sesión para finalizar el pedido.");
                window.location.href = "login.html";
                return;
            }

            const total = parseFloat(calculateTotal());
            console.log('Total:', total);
            
            // Verificar que la función crearPedido existe
            if (typeof crearPedido !== 'function') {
                alert('❌ Error: El módulo de pedidos no está cargado correctamente.');
                console.error('crearPedido no está definida. Revisa que orders.js esté cargado.');
                return;
            }
            
            // Crear el pedido
            const resultado = crearPedido(currentUser, cart, total);
            console.log('Resultado:', resultado);
            
            if (resultado.success) {
                alert(`✅ ¡Pedido ${resultado.pedido.numero} confirmado!\nTotal: $${total.toFixed(2)}\nEstado: Pendiente\n\n📦 Disfruta tus batidos, ${currentUser}!`);
                clearCart();
                renderShopView();
            } else {
                alert(`❌ Error: ${resultado.message}`);
            }
        });
    } else {
        console.warn('⚠️ No se encontró el botón #checkoutBtn');
    }
}