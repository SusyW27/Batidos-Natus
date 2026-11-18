let usuariosData = [];
async function cargarUsuarios() {
    console.log('Cargando usuarios...');
    const tbody = document.getElementById('usuariosBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-message">Cargando usuarios...</td></tr>`;
    }
    
    try {
        const response = await fetch(API_URL + 'usuarios.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'listar'
            })
        });
        const data = await response.json();
        console.log('Usuarios obtenidos:', data);
        
        if (data.success && data.usuarios) {
            usuariosData = data.usuarios.map(user => ({
                ...user,
                id: parseInt(user.id)
            }));
            console.log('Usuarios procesados:', usuariosData);
            renderTablaUsuarios(usuariosData);
        } else {
            console.error('Error al cargar usuarios:', data.message);
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="empty-message">Error al cargar usuarios: ${data.message}</td></tr>`;
            }
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        const tbody = document.getElementById('usuariosBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-message">Error de conexión al cargar usuarios</td></tr>`;
        }
    }
}

function renderTablaUsuarios(usuarios) {
    const tbody = document.getElementById('usuariosBody');
    if (!tbody) return;
    
    console.log('Renderizando tabla con usuarios:', usuarios);
    
    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-message">No hay usuarios registrados</td></tr>`;
        return;
    }
    
    let html = '';
    usuarios.forEach(user => {
        const userId = parseInt(user.id);
        console.log(`Usuario: ${user.nombre}, ID: ${userId}`);
        
        const rolClass = user.rol === 'admin' ? 'badge-admin' : 
                         user.rol === 'empleado' ? 'badge-empleado' : 'badge-cliente';
        
        const estadoClass = user.activo ? 'badge-activo' : 'badge-inactivo';
        const estadoText = user.activo ? 'Activo' : 'Inactivo';
        
        const isMainAdmin = userId === 1;
        
        // Fila con opacidad si está inactivo
        const rowStyle = !user.activo ? 'style="opacity: 0.6;"' : '';

        html += `
            <tr ${rowStyle}>
                <td>#${userId}</td>
                <td><strong>${user.nombre}</strong></td>
                <td><span class="rol-badge ${rolClass}">${user.rol}</span></td>
                <td><span class="estado-badge ${estadoClass}">${estadoText}</span></td>
                <td>${formatearFecha(user.fecha_registro)}</td>
                <td class="actions-cell">
                    ${!isMainAdmin ? `
                        <button class="btn-edit-user" data-id="${userId}" title="Editar">Editar</button>
                        <button class="btn-toggle-user ${user.activo ? 'btn-danger' : 'btn-success'}" 
                                data-id="${userId}" 
                                title="${user.activo ? 'Desactivar usuario' : 'Activar usuario'}">
                            ${user.activo ? 'Desactivar' : 'Activar'}
                        </button>
                    ` : `
                        <span style="color: #999; font-size:0.8rem;">Admin principal</span>
                    `}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    asignarEventosUsuarios();
}

function asignarEventosUsuarios() {
    console.log('Asignando eventos a los botones...');

    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.removeEventListener('click', handleEditUser);
        btn.addEventListener('click', handleEditUser);
    });
    
    // Nuevo evento para Activar/Desactivar
    document.querySelectorAll('.btn-toggle-user').forEach(btn => {
        btn.removeEventListener('click', handleToggleUser);
        btn.addEventListener('click', handleToggleUser);
    });
}

function handleEditUser(e) {
    const userId = parseInt(this.dataset.id);
    const user = usuariosData.find(u => parseInt(u.id) === userId);
    
    if (user) {
        abrirModalEditarUsuario(user);
    } else {
        alert('Usuario no encontrado. Intenta recargar la página.');
    }
}

// Nueva función para manejar el Activar/Desactivar
async function handleToggleUser(e) {
    const userId = parseInt(this.dataset.id);
    const user = usuariosData.find(u => parseInt(u.id) === userId);
    
    if (!user) {
        alert('Usuario no encontrado');
        return;
    }
    
    const nuevoEstado = !user.activo;
    const accionTexto = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de ${accionTexto} al usuario "${user.nombre}"?`)) {
        return;
    }
    
    try {
        // Usamos la misma acción 'actualizar' pero solo enviando el estado
        const response = await fetch(API_URL + 'usuarios.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'actualizar',
                id: userId,
                activo: nuevoEstado
            })
        });
        const result = await response.json();
        
        if (result.success) {
            // Actualizamos el estado local y re-renderizamos
            user.activo = nuevoEstado;
            renderTablaUsuarios(usuariosData);
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        alert('Error de conexión');
    }
}

function abrirModalCrearUsuario() {
    console.log('Abriendo modal crear usuario');
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const selectRol = document.getElementById('userRol');
    
    if (!modal) return;
    
    title.textContent = 'Nuevo Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userPassword').placeholder = 'Mínimo 3 caracteres';
    selectRol.value = 'cliente';
    document.getElementById('userActivo').checked = true;
    document.getElementById('passwordRequired').textContent = '*';
    
    // ==========================================
    // RESETEAR BLOQUEOS (por si venimos de una edición)
    // ==========================================
    selectRol.disabled = false;
    Array.from(selectRol.options).forEach(opt => opt.disabled = false);
    
    modal.style.display = 'flex';
}

function abrirModalEditarUsuario(user) {
    console.log('Editando usuario:', user.nombre);
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const selectRol = document.getElementById('userRol');
    
    if (!modal) return;
    
    title.textContent = `Editar Usuario: ${user.nombre}`;
    document.getElementById('userId').value = user.id;
    document.getElementById('userNombre').value = user.nombre;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false;
    document.getElementById('userPassword').placeholder = 'Dejar vacío para no cambiar';
    selectRol.value = user.rol;
    document.getElementById('userActivo').checked = user.activo;
    document.getElementById('passwordRequired').textContent = '';
    
    // ==========================================
    // LÓGICA DE BLOQUEO DE ROLES
    // ==========================================
    // Primero, habilitamos todo por defecto
    selectRol.disabled = false;
    Array.from(selectRol.options).forEach(opt => opt.disabled = false);

    if (user.rol === 'cliente') {
        // Un cliente no puede ser empleado.
        const optionEmpleado = selectRol.querySelector('option[value="empleado"]');
        if (optionEmpleado) optionEmpleado.disabled = true;
    } else if (user.rol === 'empleado') {
        // Un empleado no puede ser cliente.
        const optionCliente = selectRol.querySelector('option[value="cliente"]');
        if (optionCliente) optionCliente.disabled = true;
    }
    // Si es admin, puede cambiar a cualquiera (no bloqueamos nada).
    
    modal.style.display = 'flex';
}

async function guardarUsuario(event) {
    event.preventDefault();
    console.log('Guardando usuario...');
    
    const userId = document.getElementById('userId').value;
    const nombre = document.getElementById('userNombre').value.trim();
    const password = document.getElementById('userPassword').value;
    const rol = document.getElementById('userRol').value;
    const activo = document.getElementById('userActivo').checked;
    
    if (!nombre) {
        alert('El nombre de usuario es requerido');
        return;
    }
    
    if (!userId && !password) {
        alert('La contraseña es requerida para nuevos usuarios');
        document.getElementById('userPassword').focus();
        return;
    }
    
    if (password && password.length < 3) {
        alert('La contraseña debe tener al menos 3 caracteres');
        document.getElementById('userPassword').focus();
        return;
    }
    
    try {
        let action = userId ? 'actualizar' : 'crear';
        let data = {
            action: action,
            nombre: nombre,
            rol: rol,
            activo: activo
        };
        
        if (userId) data.id = parseInt(userId);
        if (password) data.contrasena = password;
        
        console.log('Enviando datos:', data);
        
        const response = await fetch(API_URL + 'usuarios.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log('Respuesta:', result);
        
        if (result.success) {
            alert(`${result.message}`);
            cerrarModalUsuario();
            cargarUsuarios();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        alert('Error de conexión');
    }
}

function cerrarModalUsuario() {
    console.log('Cerrando modal');
    document.getElementById('userModal').style.display = 'none';
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return 'Fecha no disponible';
    try {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return fechaISO;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalUsuario();
            }
        });
    }
    
    const crearBtn = document.getElementById('crearUsuarioBtn');
    if (crearBtn) {
        crearBtn.addEventListener('click', abrirModalCrearUsuario);
    }
    
    console.log('admin-users.js cargado correctamente');
});

window.cargarUsuarios = cargarUsuarios;
window.abrirModalCrearUsuario = abrirModalCrearUsuario;
window.cerrarModalUsuario = cerrarModalUsuario;
window.guardarUsuario = guardarUsuario;