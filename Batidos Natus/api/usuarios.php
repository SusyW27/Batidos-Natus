<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'listar':
        $sql = "SELECT id_usuario, nombre, rol, activo, fecha_registro 
                FROM usuarios 
                ORDER BY id_usuario ASC";
        $result = $conn->query($sql);
        $usuarios = [];
        
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = [
                'id' => $row['id_usuario'],
                'nombre' => $row['nombre'],
                'rol' => $row['rol'],
                'activo' => $row['activo'] == 1,
                'fecha_registro' => $row['fecha_registro']
            ];
        }
        
        responder([
            'success' => true,
            'usuarios' => $usuarios
        ]);
        break;
    
    case 'crear':
        $nombre = trim($data['nombre'] ?? '');
        $contrasena = $data['contrasena'] ?? '';
        $rol = $data['rol'] ?? 'cliente';
        
        if (empty($nombre) || empty($contrasena)) {
            responder(['success' => false, 'message' => 'Usuario y contraseña requeridos']);
        }
        
        if (strlen($contrasena) < 3) {
            responder(['success' => false, 'message' => 'La contraseña debe tener al menos 3 caracteres']);
        }

        // VALIDACIÓN: El rol debe ser uno de los permitidos
        if (!in_array($rol, ['cliente', 'empleado', 'admin'])) {
            responder(['success' => false, 'message' => 'Rol no válido']);
        }
        
        $sql = "SELECT id_usuario FROM usuarios WHERE nombre = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $nombre);
        $stmt->execute();
        $check = $stmt->get_result();
        
        if ($check->num_rows > 0) {
            responder(['success' => false, 'message' => 'El nombre de usuario ya existe']);
        }
        $hashed_password = password_hash($contrasena, PASSWORD_DEFAULT);
        
        $sql = "INSERT INTO usuarios (nombre, contrasena, rol, activo) VALUES (?, ?, ?, 1)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $nombre, $hashed_password, $rol);
        
        if ($stmt->execute()) {
            responder([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'id' => $conn->insert_id
            ]);
        } else {
            responder(['success' => false, 'message' => 'Error al crear usuario: ' . $conn->error]);
        }
        break;
    
    case 'actualizar':
        $id_usuario = intval($data['id'] ?? 0);
        $rol = $data['rol'] ?? '';
        $activo = isset($data['activo']) ? ($data['activo'] ? 1 : 0) : null;
        $contrasena = $data['contrasena'] ?? '';
        $nombre = trim($data['nombre'] ?? '');
        
        if ($id_usuario == 0) {
            responder(['success' => false, 'message' => 'Usuario no especificado']);
        }
        
        if ($id_usuario == 1) {
            responder(['success' => false, 'message' => 'No se puede modificar al administrador principal']);
        }

        // Obtener el rol actual del usuario en la base de datos para validar cambios
        $sqlCheckRol = "SELECT rol FROM usuarios WHERE id_usuario = ?";
        $stmtCheckRol = $conn->prepare($sqlCheckRol);
        $stmtCheckRol->bind_param("i", $id_usuario);
        $stmtCheckRol->execute();
        $resRol = $stmtCheckRol->get_result();
        
        if ($resRol->num_rows === 0) {
            responder(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        $usuarioActual = $resRol->fetch_assoc();
        $rolActual = $usuarioActual['rol'];
        
        $campos = [];
        $params = [];
        $types = '';
        
        if (!empty($rol)) {
            // VALIDACIÓN: El rol debe ser uno de los permitidos
            if (!in_array($rol, ['cliente', 'empleado', 'admin'])) {
                responder(['success' => false, 'message' => 'Rol no válido']);
            }

            // VALIDACIÓN CRUZADA: Un cliente no puede ser empleado/admin, un empleado no puede ser cliente
            if ($rolActual === 'cliente' && $rol !== 'cliente') {
                responder(['success' => false, 'message' => 'Un cliente no puede cambiar a rol de empleado o administrador.']);
            }
            if ($rolActual === 'empleado' && $rol === 'cliente') {
                responder(['success' => false, 'message' => 'Un empleado no puede cambiar a rol de cliente.']);
            }

            $campos[] = "rol = ?";
            $params[] = $rol;
            $types .= "s";
        }
        
        if ($activo !== null) {
            $campos[] = "activo = ?";
            $params[] = $activo;
            $types .= "i";
        }
        
        if (!empty($contrasena)) {
            if (strlen($contrasena) < 3) {
                responder(['success' => false, 'message' => 'La contraseña debe tener al menos 3 caracteres']);
            }
            $hashed = password_hash($contrasena, PASSWORD_DEFAULT);
            $campos[] = "contrasena = ?";
            $params[] = $hashed;
            $types .= "s";
        }

        if (!empty($nombre)) {
            // Validar que el nombre no esté en uso por OTRO usuario
            $sqlCheckNombre = "SELECT id_usuario FROM usuarios WHERE nombre = ? AND id_usuario != ?";
            $stmtCheckNombre = $conn->prepare($sqlCheckNombre);
            $stmtCheckNombre->bind_param("si", $nombre, $id_usuario);
            $stmtCheckNombre->execute();
            if ($stmtCheckNombre->get_result()->num_rows > 0) {
                responder(['success' => false, 'message' => 'El nombre de usuario ya está en uso por otra cuenta']);
            }
            $campos[] = "nombre = ?";
            $params[] = $nombre;
            $types .= "s";
        }
        
        if (empty($campos)) {
            responder(['success' => false, 'message' => 'No hay datos para actualizar']);
        }
        
        $params[] = $id_usuario;
        $types .= "i";
        
        $sql = "UPDATE usuarios SET " . implode(", ", $campos) . " WHERE id_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            responder([
                'success' => true,
                'message' => 'Usuario actualizado correctamente'
            ]);
        } else {
            responder(['success' => false, 'message' => 'Error al actualizar usuario: ' . $conn->error]);
        }
        break;
    
    case 'eliminar':
        $id_usuario = intval($data['id'] ?? 0);
        
        if ($id_usuario == 0) {
            responder(['success' => false, 'message' => 'Usuario no especificado']);
        }
        
        if ($id_usuario == 1) {
            responder(['success' => false, 'message' => 'No se puede eliminar al administrador principal']);
        }
        
        $sql = "SELECT id_usuario FROM usuarios WHERE id_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            responder(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        
        $sql = "DELETE FROM usuarios WHERE id_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_usuario);
        
        if ($stmt->execute()) {
            responder([
                'success' => true,
                'message' => 'Usuario eliminado correctamente'
            ]);
        } else {
            responder(['success' => false, 'message' => 'Error al eliminar usuario: ' . $conn->error]);
        }
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>