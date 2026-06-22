// ========== CONTROLADOR PRINCIPAL ==========

//Renderizar el área de usuario en el header
function renderUserHeader() {
    const currentUser = getCurrentUser();
    const welcomeDiv = document.getElementById("userWelcomeArea");
    
    if (!welcomeDiv) return;
    
    if (currentUser) {
        let adminLink = '';
        if (currentUser.role === 'admin') {
            adminLink = `<a href="admin.html" style="color: #e67e22; margin-right:15px; text-decoration:none; font-weight:600;">⚙️ Admin</a>`;
        }
        
        welcomeDiv.innerHTML = `
            <span>🍓 Hola, <strong>${currentUser.username}</strong></span>
            ${adminLink}
            <button class="btn-logout" id="logoutBtn">Cerrar sesión</button>
        `;
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.addEventListener("click", logout);
    } else {
        welcomeDiv.innerHTML = `<span>🔐 Sin sesión activa</span>`;
    }
}

// Funciones para el historial
function mostrarCatalogo() {
    renderShopView();
    updateNavButtons('catalogo');
}

function mostrarHistorialPedidos() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('⚠️ Debes iniciar sesión para ver tus pedidos.');
        return;
    }

    const pedidos = getPedidosByUser(currentUser.username);
    const contentDiv = document.getElementById('dynamicContent');

    updateNavButtons('historial');

    if (pedidos.length === 0) {
        contentDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📜</div>
                <h3>Mis Pedidos</h3>
                <p>No has realizado ningún pedido aún.</p>
                <button class="btn-catalogo" onclick="mostrarCatalogo()">
                    🛒 Ver catálogo
                </button>
            </div>
        `;
        return;
    }

    // Ordenar por fecha (más reciente primero)
    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = `
        <div class="historial-container">
            <div class="historial-header">
                <h2>📜 Mis Pedidos</h2>
                <button class="btn-volver" onclick="mostrarCatalogo()">
                    ← Volver al catálogo
                </button>
            </div>
            <div class="historial-table-wrapper">
                <table class="historial-table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Productos</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    pedidos.forEach(pedido => {
        const estadoClass = `estado-${pedido.estado.toLowerCase()}`;
        const productosLista = pedido.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ');

        html += `
            <tr>
                <td><strong>${pedido.numero}</strong></td>
                <td>${formatearFecha(pedido.fecha)}</td>
                <td><strong>$${pedido.total.toFixed(2)}</strong></td>
                <td>
                    <span class="estado-badge ${estadoClass}">${pedido.estado}</span>
                </td>
                <td class="productos-lista">${productosLista}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
            <!-- Versión móvil: tarjetas -->
            <div class="pedidos-mobile">
    `;

    pedidos.forEach(pedido => {
        const estadoClass = `estado-${pedido.estado.toLowerCase()}`;
        const productosLista = pedido.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ');

        html += `
            <div class="pedido-card">
                <div class="pedido-card-header">
                    <span class="pedido-card-number">${pedido.numero}</span>
                    <span class="pedido-card-date">${formatearFecha(pedido.fecha)}</span>
                </div>
                <div class="pedido-card-details">
                    <div class="detail-item">
                        <span class="detail-label">Total</span>
                        <span class="detail-value">$${pedido.total.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado</span>
                        <span class="estado-badge ${estadoClass}">${pedido.estado}</span>
                    </div>
                </div>
                <div class="pedido-card-products">
                    <strong>Productos:</strong> ${productosLista}
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    contentDiv.innerHTML = html;
}

function updateNavButtons(active) {
    const btnCatalogo = document.getElementById('verCatalogoBtn');
    const btnHistorial = document.getElementById('verHistorialBtn');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#2c5f2d';
        btn.style.border = '2px solid #2c5f2d';
    });
    
    if (active === 'catalogo' && btnCatalogo) {
        btnCatalogo.classList.add('active');
        btnCatalogo.style.background = '#2c5f2d';
        btnCatalogo.style.color = 'white';
        btnCatalogo.style.border = 'none';
    } else if (active === 'historial' && btnHistorial) {
        btnHistorial.classList.add('active');
        btnHistorial.style.background = '#2c5f2d';
        btnHistorial.style.color = 'white';
        btnHistorial.style.border = 'none';
    }
}

// Inicializar aplicación en dashboard
function initDashboard() {
    initDatabase();
    renderUserHeader();
    renderShopView();
    
    // ===== NUEVO: Configurar eventos de navegación =====
    const historialBtn = document.getElementById('verHistorialBtn');
    if (historialBtn) {
        historialBtn.addEventListener('click', mostrarHistorialPedidos);
    }
    
    const catalogoBtn = document.getElementById('verCatalogoBtn');
    if (catalogoBtn) {
        catalogoBtn.addEventListener('click', mostrarCatalogo);
    }
    
    // Actualizar nombre de usuario en la barra de navegación
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        const user = getCurrentUser();
        userDisplay.textContent = user ? `👤 ${user.username}` : '👤 Invitado';
    }
}

// Inicializar aplicación en login
function initLogin() {
    initDatabase();
    
    // Lógica de tabs
    const tabLogin = document.getElementById("tabLoginBtn");
    const tabRegister = document.getElementById("tabRegisterBtn");
    const formContainer = document.getElementById("authFormContainer");
    
    function showLoginForm() {
        formContainer.innerHTML = `
            <form id="loginForm" class="auth-form">
                <div class="input-group">
                    <label>👤 Usuario</label>
                    <input type="text" id="loginUsername" placeholder="Ej: cliente1" required>
                </div>
                <div class="input-group">
                    <label>🔒 Contraseña</label>
                    <input type="password" id="loginPassword" placeholder="********" required>
                </div>
                <button type="submit" class="auth-submit">Ingresar</button>
                <div id="authMessage" class="error-msg"></div>
            </form>
        `;
        attachLoginEvent();
    }
    
    function showRegisterForm() {
        formContainer.innerHTML = `
            <form id="registerForm" class="auth-form">
                <div class="input-group">
                    <label>👤 Nuevo Usuario</label>
                    <input type="text" id="regUsername" placeholder="Nombre único" required>
                </div>
                <div class="input-group">
                    <label>🔒 Contraseña</label>
                    <input type="password" id="regPassword" placeholder="Mínimo 3 caracteres" required>
                </div>
                <button type="submit" class="auth-submit">Crear cuenta</button>
                <div id="authMessage" class="error-msg"></div>
            </form>
        `;
        attachRegisterEvent();
    }
    
    function attachLoginEvent() {
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const username = document.getElementById("loginUsername").value.trim();
                const password = document.getElementById("loginPassword").value;
                const result = loginUser(username, password);
                const msgDiv = document.getElementById("authMessage");
                
                if (result.success) {
                    msgDiv.style.color = "#2c5f2d";
                    msgDiv.innerText = "✅ Acceso correcto. Redirigiendo...";
                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 800);
                } else {
                    msgDiv.style.color = "#dc2626";
                    msgDiv.innerText = result.message;
                }
            });
        }
    }
    
    function attachRegisterEvent() {
        const regForm = document.getElementById("registerForm");
        if (regForm) {
            regForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const username = document.getElementById("regUsername").value.trim();
                const password = document.getElementById("regPassword").value;
                const result = registerUser(username, password);
                const msgDiv = document.getElementById("authMessage");
                
                if (result.success) {
                    msgDiv.style.color = "#2c5f2d";
                    msgDiv.innerText = "✅ Registro exitoso. Ve a Iniciar Sesión.";
                    setTimeout(() => {
                        tabLogin.click();
                    }, 1200);
                } else {
                    msgDiv.style.color = "#dc2626";
                    msgDiv.innerText = result.message;
                }
            });
        }
    }
    
    if (tabLogin && tabRegister) {
        tabLogin.addEventListener("click", () => {
            tabLogin.classList.add("active");
            tabRegister.classList.remove("active");
            showLoginForm();
        });
        
        tabRegister.addEventListener("click", () => {
            tabRegister.classList.add("active");
            tabLogin.classList.remove("active");
            showRegisterForm();
        });
    }
    
    showLoginForm();
}

// Verificar página actual y ejecutar inicialización correspondiente
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split('/').pop() || "index.html";
    
    // Verificar autenticación y redirigir
    checkAuth();
    
    // Inicializar según la página
    if (currentPage === "dashboard.html") {
        initDashboard();
    } else if (currentPage === "login.html") {
        initLogin();
    } else if (currentPage === "index.html") {
        
        if (getCurrentUser()) {
            window.location.href = "dashboard.html";
        } else {
            window.location.href = "login.html";
        }
    }
});

// SOLUCIÓN DE SEGURIDAD
// Esto asegura que el botón "Finalizar Pedido" siempre funcione
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target && target.id === 'checkoutBtn') {
            console.log('🔄 Checkout clickeado (delegación)');
            const cart = getCart();
            if (cart.length === 0) {
                alert("🛒 Tu carrito está vacío.");
                return;
            }
            const currentUser = getCurrentUser();
            if (!currentUser) {
                alert("⚠️ Debes iniciar sesión.");
                window.location.href = "login.html";
                return;
            }
            const total = parseFloat(calculateTotal());
            const resultado = crearPedido(currentUser.username, cart, total);
            if (resultado.success) {
                alert(`✅ ¡Pedido ${resultado.pedido.numero} confirmado!\nTotal: $${total.toFixed(2)}\nEstado: Pendiente\n\n📦 Disfruta tus batidos, ${currentUser.username}!`);
                clearCart();
                renderShopView();
            } else {
                alert(`❌ Error: ${resultado.message}`);
            }
        }
    });
});

// ===== EXPORTAR FUNCIONES PARA USO GLOBAL =====
window.mostrarCatalogo = mostrarCatalogo;
window.mostrarHistorialPedidos = mostrarHistorialPedidos;
window.updateNavButtons = updateNavButtons;