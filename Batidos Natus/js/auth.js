async function loginUserAPI(username, password) {
    try {
        const response = await fetch(API_URL + 'auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                nombre: username,
                contrasena: password
            })
        });
        const data = await response.json();
        
        if (data.success) {
            // Guardamos la sesión
            localStorage.setItem('batidos_natus_session', JSON.stringify(data.user));
            
            // REDIRECCIÓN INTELIGENTE
            const role = data.user.role;
            let redirectUrl = 'dashboard.html'; // Por defecto clientes

            if (role === 'admin') {
                redirectUrl = 'admin.html';
            } else if (role === 'empleado') {
                redirectUrl = 'empleado.html'; // Asumiendo que tienes este archivo
            }

            // Redirigimos después de un breve instante para que el usuario vea el mensaje
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 800);

            return { success: true, message: data.message, role: data.user.role };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, message: 'Error de conexión con el servidor' };
    }
}

async function registerUserAPI(username, password, role = 'cliente') {
    try {
        const response = await fetch(API_URL + 'auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'register',
                nombre: username,
                contrasena: password,
                rol: role
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en registro:', error);
        return { success: false, message: 'Error de conexión con el servidor' };
    }
}

function getCurrentUser() {
    const session = localStorage.getItem('batidos_natus_session');
    if (session) {
        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function getCurrentUsername() {
    const user = getCurrentUser();
    return user ? user.username : null;
}

function logout() {
    console.log('Ejecutando..');
    localStorage.removeItem('batidos_natus_session');
    window.location.href = 'login.html';
}

function checkAuth() {
    const currentUser = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop() || "index.html";
    
    // Si no hay sesión y no está en login o index, lo mandamos a login
    if (!currentUser && currentPage !== "login.html" && currentPage !== "index.html") {
        window.location.href = "login.html";
        return;
    }
    
    // Si hay sesión y está en login o index, lo mandamos a su panel
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
    
    // Control de acceso por roles
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

window.loginUser = loginUserAPI;
window.registerUser = registerUserAPI;
window.getCurrentUser = getCurrentUser;
window.getCurrentUsername = getCurrentUsername;
window.logout = logout;
window.checkAuth = checkAuth;

console.log('auth.js cargado con conexión a API');