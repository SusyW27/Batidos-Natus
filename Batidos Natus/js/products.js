let productsCatalog = [];

async function cargarProductosDesdeAPI() {
    console.log('Intentando cargar productos desde API...');
    const contentDiv = document.getElementById("dynamicContent");
    
    try {
        const url = API_URL + 'productos.php';
        console.log('URL completa:', url);
        
        const response = await fetch(url);
        console.log('Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success && data.productos) {
            productsCatalog = data.productos.map(p => ({
                id: parseInt(p.id_producto) || parseInt(p.id) || 0,
                name: p.nombre || p.name || 'Producto',
                price: parseFloat(p.precio || p.price || 0),
                description: p.descripcion || p.description || '',
                categoria: p.categoria || 'Frutales',
                stock: parseInt(p.stock || 0),
                image: p.imagen_url || p.image || 'img/default.jpg'
            }));
            
            localStorage.setItem('productsCatalog', JSON.stringify(productsCatalog));
            console.log('Productos cargados correctamente:', productsCatalog.length);
            console.log('Primer producto:', productsCatalog[0]);
            renderShopView();
        } else {
            console.error('La API no devolvió productos:', data);
            contentDiv.innerHTML = `
                <div style="text-align:center; padding:40px; color:#e74c3c;">
                    <h3>Error al cargar productos</h3>
                    <p>${data.message || 'La API no devolvió productos'}</p>
                    <button onclick="cargarProductosDesdeAPI()" style="background: #2c5f2d; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer; margin-top:16px;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        contentDiv.innerHTML = `
            <div style="text-align:center; padding:40px; color:#e74c3c;">
                <h3>Error de conexión</h3>
                <p>${error.message}</p>
                <p style="font-size:0.8rem; color: #888;">Verifica que XAMPP (Apache) esté corriendo.</p>
                <button onclick="cargarProductosDesdeAPI()" style="background: #2c5f2d; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer; margin-top:16px;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

function renderProducts() {
    console.log('renderProducts ejecutándose, productos:', productsCatalog);
    
    if (!productsCatalog || !Array.isArray(productsCatalog) || productsCatalog.length === 0) {
        return `<h2>Nuestros Batidos Naturales</h2>
                <div style="text-align:center; padding:40px; color: #888;">
                    <p>No hay productos disponibles.</p>
                </div>`;
    }
    
    let productsHtml = `<h2>Nuestros Batidos Naturales</h2>
                        <div class="products-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:20px; padding:10px 0;">`;
    
    productsCatalog.forEach(product => {
        const name = product.name || 'Producto sin nombre';
        const price = product.price || 0;
        const description = product.description || '';
        const image = product.image || 'img/default.jpg';
        const stock = product.stock || 0;
        const isOutOfStock = stock <= 0;
        const buttonDisabled = isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : '';
        const buttonText = isOutOfStock ? 'Agotado' : 'Agregar Pedido';
        
        productsHtml += `
            <div class="product-card" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08); transition:transform 0.3s ease;">
                <div class="product-img" style="background: url('${image}'); background-size: cover; background-position: center; height:180px; position:relative;">
                    <span class="badge-natural" style="position:absolute; top:10px; left:10px; background: #2c5f2d; color:white; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:bold;">100% Natural</span>
                    ${isOutOfStock ? '<span style="position:absolute; top:10px; right:10px; background:#e74c3c; color:white; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:bold;">Sin Stock</span>' : ''}
                </div>
                <div class="product-info" style="padding:16px;">
                    <h3 style="margin:0 0 4px 0; font-size:1.1rem; color: #333;">${name}</h3>
                    <div class="price" style="font-weight:bold; color: #2c5f2d; font-size:1.3rem;">$${price.toFixed(2)}</div>
                    <div class="desc" style="color: #666; font-size:0.85rem; margin:8px 0; min-height:40px;">${description}</div>
                    <button class="add-btn" 
                            data-id="${product.id}" 
                            data-name="${name}" 
                            data-price="${price}" 
                            data-image="${image}"
                            ${buttonDisabled} 
                            style="background:${isOutOfStock ? '#999' : '#4CAF50'}; color:white; border:none; padding:10px 16px; border-radius:40px; cursor:${isOutOfStock ? 'not-allowed' : 'pointer'}; font-weight:bold; margin-top:8px; width:100%; transition:background 0.3s ease;">
                        ${buttonText}
                    </button>
                    ${!isOutOfStock ? `<span style="font-size:0.7rem; color: #888; display:block; margin-top:6px; text-align:center;"> Stock: ${stock} uds.</span>` : ''}
                </div>
            </div>
        `;
    });
    
    productsHtml += `</div>`;
    return productsHtml;
}

function renderCart() {
    const currentUser = getCurrentUsername() || 'Invitado';
    let cart = getCart() || [];
    const total = calculateTotal();

    cart = cart.map(item => {
        if (!item.image || item.image === 'img/default.jpg') {
            const product = productsCatalog.find(p => p.id === item.id);
            if (product) {
                item.image = product.image || 'img/default.jpg';
            }
        }
        return item;
    });

    let cartHtml = `<div class="cart-summary" style="background:white; border-radius:12px; padding:20px; margin-top:20px; box-shadow:0 2px 10px rgba(0,0,0,0.08);">
                        <div class="cart-title" style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f0f0f0; padding-bottom:12px; margin-bottom:12px;">
                            <span style="font-weight:bold; font-size:1.2rem;">Tu Pedido</span>
                            <span style="font-size:0.9rem; color: #888;">${currentUser}</span>
                        </div>`;

    if (cart.length === 0) {
        cartHtml += `<div class="empty-cart" style="text-align:center; padding:20px; color:#888;">Aún no has agregado batidos. ¡Pide tu favorito!</div>`;
    } else {
        cartHtml += `<ul class="cart-items" style="list-style:none; padding:0; margin:0;">`;
        cart.forEach(item => {
            const imgSrc = item.image || 'img/default.jpg';
            cartHtml += `
                <li style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <img src="${imgSrc}" alt="${item.name}" 
                         style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid #2c5f2d; flex-shrink: 0;">
                    <div style="flex: 1;">
                        <strong style="font-size:0.95rem;">${item.name}</strong> 
                        <span style="color:#666; font-size:0.85rem;">x${item.quantity}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="font-weight: bold; min-width: 70px; font-size:0.95rem;">$${(item.price * item.quantity).toFixed(2)}</span>
                        <button class="btn-qty" data-id="${item.id}" data-delta="-1" 
                                style="background: #f39c12; border:2px solid #f39c12; color:white; width:30px; height:30px; border-radius:50%; cursor:pointer; font-weight:bold; font-size:1.1rem; transition:all 0.2s;">−</button>
                        <button class="btn-qty" data-id="${item.id}" data-delta="1" 
                                style="background: #4CAF50; color:white; border:2px solid #4CAF50; width:30px; height:30px; border-radius:50%; cursor:pointer; font-weight:bold; font-size:1.1rem; transition:all 0.2s;">+</button>
                        <button class="btn-remove" data-id="${item.id}" 
                                style="background: #e74c3c; color:white; border:2px solid #e74c3c; width:30px; height:30px; border-radius:50%; cursor:pointer; font-weight:bold; font-size:1.1rem; transition:all 0.2s;">✖</button>
                    </div>
                </li>
            `;
        });
        cartHtml += `</ul>
        <div class="total" style="font-weight:bold; font-size:1.2rem; padding:12px 0; text-align:right; border-top:2px solid #2c5f2d; margin-top:8px;">
            Total: $${total}
        </div>`;
    }

    cartHtml += `</div>`;
    
    cartHtml += `<div style="margin-top:1.2rem; text-align:right;">
                    <button id="checkoutBtn" style="background: #e67e22; border:none; padding:0.8rem 2rem; border-radius:40px; color:white; font-weight:bold; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 12px rgba(230,126,34,0.3); transition:all 0.3s;">
                        Finalizar Pedido
                    </button>
                 </div>`;

    return cartHtml;
}

function renderShopView() {
    console.log('renderShopView ejecutándose...');
    console.log('productsCatalog:', productsCatalog);
    
    const contentDiv = document.getElementById("dynamicContent");
    if (!contentDiv) {
        console.error('No se encontró el contenedor #dynamicContent');
        return;
    }
    
    try {
        if (!productsCatalog || !Array.isArray(productsCatalog) || productsCatalog.length === 0) {
            console.warn('productsCatalog está vacío, mostrando mensaje');
            contentDiv.innerHTML = `
                <div style="text-align:center; padding:40px;">
                    <h3>Nuestros Batidos Naturales</h3>
                    <p style="color: #888;">No hay productos disponibles en este momento.</p>
                    <button onclick="cargarProductosDesdeAPI()" style="background: #2c5f2d; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer; margin-top:16px;">
                        Reintentar
                    </button>
                </div>
            `;
            return;
        }
        
        const productsHtml = renderProducts();
        const cartHtml = renderCart();
        contentDiv.innerHTML = productsHtml + cartHtml;
        console.log('Vista renderizada correctamente');
        
        attachProductEvents();
        attachCartEvents();
    } catch (error) {
        console.error('Error al renderizar:', error);
        console.error('Stack trace:', error.stack);
        contentDiv.innerHTML = `
            <div style="text-align:center; padding:40px; color: #e74c3c;">
                <h3>Error al cargar los productos</h3>
                <p style="color: #888;">${error.message}</p>
                <button onclick="cargarProductosDesdeAPI()" style="background: #2c5f2d; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer; margin-top:16px;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

function attachProductEvents() {
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            const image = btn.dataset.image || 'img/default.jpg';
            
            console.log('Añadiendo producto:', { id, name, price, image });
            
            if (id === 0 || isNaN(id)) {
                console.error('ID inválido:', id);
                alert('Error: El producto no tiene un ID válido');
                return;
            }
            
            addToCart({ id, name, price, image });
        });
    });
}

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

    const oldCheckoutBtn = document.getElementById('checkoutBtn');
    if (oldCheckoutBtn) {
        const newCheckoutBtn = oldCheckoutBtn.cloneNode(true);
        oldCheckoutBtn.parentNode.replaceChild(newCheckoutBtn, oldCheckoutBtn);
    }
}

window.cargarProductosDesdeAPI = cargarProductosDesdeAPI;
window.renderShopView = renderShopView;
window.renderCart = renderCart;
window.renderProducts = renderProducts;

console.log('products.js cargado correctamente');