function renderUserHeader() {
    const currentUser = getCurrentUser();
    const welcomeDiv = document.getElementById("userWelcomeArea");
    
    if (!welcomeDiv) return;
    
    if (currentUser) {
        let adminLink = '';
        let empleadoLink = '';
        let dashboardLink = '';
        
        if (currentUser.role === 'admin') {
            adminLink = `<a href="admin.html" style="color: #e67e22; margin-right:15px; text-decoration:none; font-weight:600;">Admin</a>`;
            empleadoLink = `<a href="empleado.html" style="color: #3498db; margin-right:15px; text-decoration:none; font-weight:600;">Empleado</a>`;
        }
        
        if (currentUser.role === 'empleado') {
            empleadoLink = `<a href="empleado.html" style="color: #3498db; margin-right:15px; text-decoration:none; font-weight:600;">Panel</a>`;
            dashboardLink = `<a href="dashboard.html" style="color: #2c5f2d; margin-right:15px; text-decoration:none; font-weight:600;">Tienda</a>`;
        }
        
        if (currentUser.role === 'cliente') {
            dashboardLink = `<a href="dashboard.html" style="color: #2c5f2d; margin-right:15px; text-decoration:none; font-weight:600;">Tienda</a>`;
        }
        
        welcomeDiv.innerHTML = `
            <span>Hola, <strong>${currentUser.username}</strong></span>
            ${dashboardLink}
            ${adminLink}
            ${empleadoLink}
            <button class="btn-logout" id="logoutBtn">Cerrar sesión</button>
        `;
        
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.addEventListener("click", logout);
    } else {
        welcomeDiv.innerHTML = `<span>Sin sesión activa</span>`;
    }
}

function mostrarCatalogo() {
    renderShopView();
    updateNavButtons('catalogo');
    setTimeout(initScrollButtons, 400);
}

async function mostrarHistorialPedidos() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Debes iniciar sesión para ver tus pedidos.');
        return;
    }

    const pedidos = await getPedidosByUser(currentUser.username);
    const contentDiv = document.getElementById('dynamicContent');

    updateNavButtons('historial');

    if (pedidos.length === 0) {
        contentDiv.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:60px 20px;">
                <h3>Mis Pedidos</h3>
                <p style="color: #888;">No has realizado ningún pedido aún.</p>
                <button class="btn-catalogo" onclick="mostrarCatalogo()" style="background: #4CAF50; color:white; border:none; padding:10px 30px; border-radius:40px; cursor:pointer; font-weight:600; margin-top:16px;">
                    Ver catálogo
                </button>
            </div>
        `;
        return;
    }

    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = `
        <div class="historial-container" style="max-width:900px; margin:0 auto; padding:20px 0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                <h2>Mis Pedidos</h2>
                <button onclick="mostrarCatalogo()" style="background: #2c5f2d; color:white; border:none; padding:8px 20px; border-radius:40px; cursor:pointer; font-weight:600;">
                    ← Volver al catálogo
                </button>
            </div>
            <div style="overflow-x:auto; background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                    <thead>
                        <tr style="background: #2c5f2d; color:white;">
                            <th style="padding:12px 15px; text-align:left;">Pedido</th>
                            <th style="padding:12px 15px; text-align:left;">Fecha</th>
                            <th style="padding:12px 15px; text-align:left;">Total</th>
                            <th style="padding:12px 15px; text-align:left;">Estado</th>
                            <th style="padding:12px 15px; text-align:left;">Productos</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    pedidos.forEach(pedido => {
        const estadoClass = `estado-${(pedido.estado || 'pendiente').toLowerCase()}`;
        const productosLista = pedido.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ');
        const total = parseFloat(pedido.total || 0);
        const numero = pedido.numero_pedido || pedido.numero || pedido.id_pedido || 'N/A';

        html += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:12px 15px;"><strong>${numero}</strong></td>
                <td style="padding:12px 15px;">${formatearFecha(pedido.fecha)}</td>
                <td style="padding:12px 15px;"><strong>$${total.toFixed(2)}</strong></td>
                <td style="padding:12px 15px;">
                    <span class="estado-badge ${estadoClass}">${pedido.estado || 'Pendiente'}</span>
                </td>
                <td style="padding:12px 15px; font-size:0.85rem;">${productosLista}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    contentDiv.innerHTML = html;
    setTimeout(initScrollButtons, 400);
}

function updateNavButtons(active) {
    const btnCatalogo = document.getElementById('verCatalogoBtn');
    const btnHistorial = document.getElementById('verHistorialBtn');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#1c7721';
        btn.style.border = '2px solid #1c7721';
    });
    
    if (active === 'catalogo' && btnCatalogo) {
        btnCatalogo.classList.add('active');
        btnCatalogo.style.background = '#1c7721';
        btnCatalogo.style.color = 'white';
        btnCatalogo.style.border = 'none';
    } else if (active === 'historial' && btnHistorial) {
        btnHistorial.classList.add('active');
        btnHistorial.style.background = '#1c7721';
        btnHistorial.style.color = 'white';
        btnHistorial.style.border = 'none';
    }
}

function initDashboard() {
    renderUserHeader();
    
    if (typeof cargarProductosDesdeAPI === 'function') {
        cargarProductosDesdeAPI();
    } else {
        console.warn('cargarProductosDesdeAPI no está definida');
        const cached = localStorage.getItem('productsCatalog');
        if (cached) {
            productsCatalog = JSON.parse(cached);
            renderShopView();
        }
    }
    
    const historialBtn = document.getElementById('verHistorialBtn');
    if (historialBtn) {
        historialBtn.addEventListener('click', mostrarHistorialPedidos);
    }
    
    const catalogoBtn = document.getElementById('verCatalogoBtn');
    if (catalogoBtn) {
        catalogoBtn.addEventListener('click', mostrarCatalogo);
    }
    
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        const user = getCurrentUser();
        userDisplay.textContent = user ? `${user.username}` : 'Invitado';
    }
}

function initLogin() {
    const tabLogin = document.getElementById("tabLoginBtn");
    const tabRegister = document.getElementById("tabRegisterBtn");
    const formContainer = document.getElementById("authFormContainer");
    
    function showLoginForm() {
        formContainer.innerHTML = `
            <form id="loginForm" class="auth-form">
                <div class="input-group">
                    <label>Usuario</label>
                    <input type="text" id="loginUsername" placeholder="Ej: cliente1" required>
                </div>
                <div class="input-group">
                    <label>Contraseña</label>
                    <div class="password-wrapper">
                        <input type="password" id="loginPassword" placeholder="********" required>
                        <button type="button" id="togglePasswordBtn" class="toggle-password-btn" title="Mostrar contraseña">
                            ⨀
                        </button>
                    </div>
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
                    <label>Nuevo Usuario</label>
                    <input type="text" id="regUsername" placeholder="Nombre único" required>
                </div>
                <div class="input-group">
                    <label>Contraseña</label>
                    <div class="password-wrapper">
                        <input type="password" id="regPassword" placeholder="Mínimo 3 caracteres" required>
                        <button type="button" id="toggleRegisterPasswordBtn" class="toggle-password-btn" title="Mostrar contraseña">
                            ⨀
                        </button>
                    </div>
                </div>
                <button type="submit" class="auth-submit">Crear cuenta</button>
                <div id="authMessage" class="error-msg"></div>
            </form>
        `;
        attachRegisterEvent();
    }
    
    async function attachLoginEvent() {
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            const toggleBtn = document.getElementById('togglePasswordBtn');
            const passwordInput = document.getElementById('loginPassword');
            
            if (toggleBtn && passwordInput) {
                toggleBtn.addEventListener('click', function() {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        toggleBtn.textContent = '⨂';
                        toggleBtn.title = 'Ocultar contraseña';
                    } else {
                        passwordInput.type = 'password';
                        toggleBtn.textContent = '⨀';
                        toggleBtn.title = 'Mostrar contraseña';
                    }
                });
            }
            
            loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const username = document.getElementById("loginUsername").value.trim();
                const password = document.getElementById("loginPassword").value;
                const msgDiv = document.getElementById("authMessage");
                
                const result = await loginUserAPI(username, password);
                
                if (result.success) {
                    msgDiv.style.color = "#2c5f2d";
                    msgDiv.innerText = "Acceso correcto. Redirigiendo...";
                    setTimeout(() => {
                        const user = getCurrentUser();
                        if (user) {
                            if (user.role === 'admin') {
                                window.location.href = "admin.html";
                            } else if (user.role === 'empleado') {
                                window.location.href = "empleado.html";
                            } else {
                                window.location.href = "dashboard.html";
                            }
                        } else {
                            window.location.href = "dashboard.html";
                        }
                    }, 800);
                } else {
                    msgDiv.style.color = "#dc2626";
                    msgDiv.innerText = result.message;
                }
            });
        }
    }
    
    async function attachRegisterEvent() {
        const regForm = document.getElementById("registerForm");
        if (regForm) {
            const toggleBtn = document.getElementById('toggleRegisterPasswordBtn');
            const passwordInput = document.getElementById('regPassword');
            
            if (toggleBtn && passwordInput) {
                toggleBtn.addEventListener('click', function() {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        toggleBtn.textContent = '⨀';
                        toggleBtn.title = 'Ocultar contraseña';
                    } else {
                        passwordInput.type = 'password';
                        toggleBtn.textContent = '⨂';
                        toggleBtn.title = 'Mostrar contraseña';
                    }
                });
            }
            
            regForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const username = document.getElementById("regUsername").value.trim();
                const password = document.getElementById("regPassword").value;
                const msgDiv = document.getElementById("authMessage");
                            
                const result = await registerUserAPI(username, password);
                            
                if (result.success) {
                    msgDiv.style.color = "#2c5f2d";
                    msgDiv.innerText = "Registro exitoso. Ve a Iniciar Sesión.";
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

function checkAuth() {
    const currentUser = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop() || "index.html";
    
    if (!currentUser && currentPage !== "login.html" && currentPage !== "index.html") {
        window.location.href = "login.html";
        return;
    }
    
    if (currentUser && (currentPage === "login.html" || currentPage === "index.html")) {
        if (currentUser.role === 'admin') {
            window.location.href = "admin.html";
        } else if (currentUser.role === 'empleado') {
            window.location.href = "empleado.html";
        } else {
            window.location.href = "dashboard.html";
        }
        return;
    }
    
    if (currentUser) {
        if (currentUser.role === 'cliente') {
            if (currentPage === "admin.html" || currentPage === "empleado.html" || currentPage === "inventory.html") {
                alert('Acceso denegado. No tienes permisos para esta sección.');
                window.location.href = "dashboard.html";
                return;
            }
        }
        if (currentUser.role === 'empleado') {
            if (currentPage === "admin.html" || currentPage === "inventory.html") {
                alert('Acceso denegado. Solo administradores pueden acceder.');
                window.location.href = "empleado.html";
                return;
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split('/').pop() || "index.html";
    
    checkAuth();
    
    if (currentPage === "dashboard.html") {
        initDashboard();
    } else if (currentPage === "login.html") {
        initLogin();
    } else if (currentPage === "index.html") {}
});

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', async function(e) {
        const target = e.target;
        if (target && target.id === 'checkoutBtn') {
            console.log('Checkout clickeado (delegación)');
            const cart = getCart();
            if (cart.length === 0) {
                alert("Tu carrito está vacío.");
                return;
            }
            const currentUser = getCurrentUser();
            if (!currentUser) {
                alert("Debes iniciar sesión.");
                window.location.href = "login.html";
                return;
            }
            const total = parseFloat(calculateTotal());
            console.log('Total:', total);
            
            try {
                const resultado = await crearPedido(currentUser.username, cart, total);
                console.log('Resultado:', resultado);
                
                if (resultado.success) {
                    alert(`¡Pedido ${resultado.numero || 'confirmado'}!\nTotal: $${total.toFixed(2)}\nEstado: Pendiente\n\nDisfruta tus batidos, ${currentUser.username}!`);
                    clearCart();
                    renderShopView();
                } else {
                    alert(`Error: ${resultado.message}`);
                }
            } catch (error) {
                console.error('Error al crear pedido:', error);
                alert('Error al procesar el pedido. Intenta de nuevo.');
            }
        }
    });
});

function initScrollButtons() {
    const scrollDownBtn = document.getElementById('scrollToCartBtn');
    const scrollUpBtn = document.getElementById('scrollToTopBtn');

    if (!scrollDownBtn) return;

    function toggleScrollButtons() {
        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollY > 300) {
            scrollUpBtn.style.display = 'flex';
            scrollUpBtn.style.opacity = '1';
        } else {
            scrollUpBtn.style.display = 'none';
            scrollUpBtn.style.opacity = '0';
        }

        const cartElement = document.querySelector('.cart-summary');
        if (cartElement) {
            const cartRect = cartElement.getBoundingClientRect();
            const isCartVisible = cartRect.top < windowHeight && cartRect.bottom > 0;
            if (isCartVisible && scrollY > 100) {
                scrollDownBtn.style.opacity = '0.3';
                scrollDownBtn.style.pointerEvents = 'none';
            } else {
                scrollDownBtn.style.opacity = '1';
                scrollDownBtn.style.pointerEvents = 'auto';
            }
        }
    }

    scrollDownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            checkoutBtn.style.transition = 'box-shadow 0.3s ease';
            checkoutBtn.style.boxShadow = '0 0 0 4px #2c5f2d, 0 0 0 8px rgba(44, 95, 45, 0.3)';
            setTimeout(() => {
                checkoutBtn.style.boxShadow = '';
            }, 1500);
        } else {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }
    });

    scrollUpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    window.addEventListener('scroll', toggleScrollButtons);
    window.addEventListener('resize', toggleScrollButtons);
    setTimeout(toggleScrollButtons, 500);
}

const originalRenderShopView = window.renderShopView;
if (originalRenderShopView) {
    window.renderShopView = function() {
        originalRenderShopView();
        setTimeout(initScrollButtons, 300);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initScrollButtons, 1000);
});

window.mostrarCatalogo = mostrarCatalogo;
window.mostrarHistorialPedidos = mostrarHistorialPedidos;
window.updateNavButtons = updateNavButtons;
window.initDashboard = initDashboard;
window.initLogin = initLogin;
window.checkAuth = checkAuth;
window.renderUserHeader = renderUserHeader;

console.log('main.js cargado correctamente');