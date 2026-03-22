// ========== SISTEMA DE AUTENTICACIÓN ==========
// Base de datos simulada en localStorage

const DB_KEYS = {
    USERS: "batidos_natus_users",
    CURRENT_SESSION: "batidos_natus_session",
    CART_PREFIX: "cart_"
};

// Inicializar usuarios por defecto si no existen
function initDatabase() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        const defaultUsers = [
            { username: "cliente1", password: "batido123" },
            { username: "ana", password: "natural" },
            { username: "juan", password: "fruta" }
        ];
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(defaultUsers));
    }
}

// Obtener lista de usuarios
function getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
}

// Guardar usuarios
function saveUsers(users) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
}

// Registrar nuevo usuario
function registerUser(username, password) {
    const users = getUsers();
    
    // Validaciones
    if (!username || username.trim() === "") {
        return { success: false, message: "El usuario no puede estar vacío." };
    }
    if (password.length < 3) {
        return { success: false, message: "La contraseña debe tener al menos 3 caracteres." };
    }
    if (users.find(u => u.username === username)) {
        return { success: false, message: "El nombre de usuario ya existe." };
    }
    
    users.push({ username, password });
    saveUsers(users);
    return { success: true, message: "Registro exitoso. Inicia sesión." };
}

// Login de usuario
function loginUser(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem(DB_KEYS.CURRENT_SESSION, username);
        // Inicializar carrito para el usuario si no existe
        const cartKey = DB_KEYS.CART_PREFIX + username;
        if (!localStorage.getItem(cartKey)) {
            localStorage.setItem(cartKey, JSON.stringify([]));
        }
        return { success: true, message: "Bienvenido/a" };
    }
    return { success: false, message: "Usuario o contraseña incorrectos." };
}

// Cerrar sesión
function logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_SESSION);
    window.location.href = "login.html";
}

// Obtener usuario logueado actual
function getCurrentUser() {
    return localStorage.getItem(DB_KEYS.CURRENT_SESSION);
}

// Verificar si hay sesión activa y redirigir
function checkAuth() {
    const currentUser = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!currentUser && currentPage !== "login.html") {
        window.location.href = "login.html";
    } else if (currentUser && currentPage === "login.html") {
        window.location.href = "dashboard.html";
    }
}
