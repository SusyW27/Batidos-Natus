// ========== CONTROLADOR PRINCIPAL ==========

// Renderizar el área de usuario en el header
function renderUserHeader() {
    const currentUser = getCurrentUser();
    const welcomeDiv = document.getElementById("userWelcomeArea");
    
    if (!welcomeDiv) return;
    
    if (currentUser) {
        welcomeDiv.innerHTML = `
            <span>🍓 Hola, <strong>${currentUser}</strong></span>
            <button class="btn-logout" id="logoutBtn">Cerrar sesión</button>
        `;
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.addEventListener("click", logout);
    } else {
        welcomeDiv.innerHTML = `<span>🔐 Sin sesión activa</span>`;
    }
}

// Inicializar aplicación en dashboard
function initDashboard() {
    initDatabase();
    renderUserHeader();
    renderShopView();
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
    
    // Verificar autenticación y redirigir si es necesario
    checkAuth();
    
    // Inicializar según la página
    if (currentPage === "dashboard.html") {
        initDashboard();
    } else if (currentPage === "login.html") {
        initLogin();
    } else if (currentPage === "index.html") {
        // Si es index, redirigir según sesión
        if (getCurrentUser()) {
            window.location.href = "dashboard.html";
        } else {
            window.location.href = "login.html";
        }
    }
});
