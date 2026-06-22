// AUTENTICACIÓN - Base de datos simulada en localStorage

const DB_KEYS = {
    USERS: "batidos_natus_users",
    CURRENT_SESSION: "batidos_natus_session",
    CART_PREFIX: "cart_"
};

// Inicializar usuarios por defecto si no existen
function initDatabase() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        const defaultUsers = [
            { username: "cliente1", password: "batido123", role: "cliente" },
            { username: "ana", password: "natural", role: "cliente" },
            { username: "juan", password: "fruta", role: "cliente" },
            { username: "admin", password: "admin123", role: "admin" }
        ];
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(defaultUsers));
    } else {
        // Verificar que el admin exista (por si ya había datos)
        const users = getUsers();
        const adminExists = users.find(u => u.username === "admin");
        if (!adminExists) {
            users.push({ username: "admin", password: "admin123", role: "admin" });
            saveUsers(users);
        }
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

// Registrar nuevo usuario (ahora con role)
function registerUser(username, password, role = "cliente") {
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
    
    users.push({ username, password, role });
    saveUsers(users);
    return { success: true, message: "Registro exitoso. Inicia sesión." };
}

// Login de usuario (ahora retorna el rol)
function loginUser(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem(DB_KEYS.CURRENT_SESSION, JSON.stringify({
            username: user.username,
            role: user.role || "cliente"
        }));
        // Inicializar carrito para el usuario si no existe
        const cartKey = DB_KEYS.CART_PREFIX + username;
        if (!localStorage.getItem(cartKey)) {
            localStorage.setItem(cartKey, JSON.stringify([]));
        }
        return { success: true, message: "Bienvenido/a", role: user.role };
    }
    return { success: false, message: "Usuario o contraseña incorrectos." };
}

// Cerrar sesión
function logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_SESSION);
    window.location.href = "login.html";
}

// Obtener usuario logueado actual (objeto completo)
function getCurrentUser() {
    const session = localStorage.getItem(DB_KEYS.CURRENT_SESSION);
    if (session) {
        try {
            return JSON.parse(session);
        } catch (e) {
            // Si es texto plano (versión antigua), lo convertimos
            return { username: session, role: "cliente" };
        }
    }
    return null;
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

// Obtener solo el nombre de usuario (para compatibilidad)
function getCurrentUsername() {
    const user = getCurrentUser();
    return user ? user.username : null;
}