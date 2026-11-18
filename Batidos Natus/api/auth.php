<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'login':
        $nombre = $data['nombre'] ?? '';
        $contrasena = $data['contrasena'] ?? '';
        
        if (empty($nombre) || empty($contrasena)) {
            responder(['success' => false, 'message' => 'Usuario y contraseña requeridos']);
        }
        $sql = "SELECT id_usuario, nombre, rol, contrasena FROM usuarios WHERE nombre = ? AND activo = 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $nombre);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            if (password_verify($contrasena, $user['contrasena'])) {
                responder([
                    'success' => true,
                    'message' => 'Bienvenido/a',
                    'user' => [
                        'id' => $user['id_usuario'],
                        'username' => $user['nombre'],
                        'role' => $user['rol']
                    ]
                ]);
            } else {
                responder(['success' => false, 'message' => 'Contraseña incorrecta']);
            }
        } else {
            responder(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        break;
    
    case 'register':
        $nombre = $data['nombre'] ?? '';
        $contrasena = $data['contrasena'] ?? '';
        $rol = $data['rol'] ?? 'cliente';
        
        if (empty($nombre) || empty($contrasena)) {
            responder(['success' => false, 'message' => 'Usuario y contraseña requeridos']);
        }
        
        if (strlen($contrasena) < 3) {
            responder(['success' => false, 'message' => 'La contraseña debe tener al menos 3 caracteres']);
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
        
        $sql = "INSERT INTO usuarios (nombre, contrasena, rol) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $nombre, $hashed_password, $rol);
        
        if ($stmt->execute()) {
            responder(['success' => true, 'message' => 'Registro exitoso']);
        } else {
            responder(['success' => false, 'message' => 'Error al registrar usuario: ' . $conn->error]);
        }
        break;
    
    case 'cambiar_contrasena':
        $id_usuario = intval($data['id_usuario'] ?? 0);
        $contrasena_actual = $data['contrasena_actual'] ?? '';
        $contrasena_nueva = $data['contrasena_nueva'] ?? '';
        
        if ($id_usuario == 0 || empty($contrasena_actual) || empty($contrasena_nueva)) {
            responder(['success' => false, 'message' => 'Datos incompletos']);
        }
        
        if (strlen($contrasena_nueva) < 3) {
            responder(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 3 caracteres']);
        }
        
        $sql = "SELECT contrasena FROM usuarios WHERE id_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if (!$user) {
            responder(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        
        if (!password_verify($contrasena_actual, $user['contrasena'])) {
            responder(['success' => false, 'message' => 'Contraseña actual incorrecta']);
        }
        
        $hashed_password = password_hash($contrasena_nueva, PASSWORD_DEFAULT);
        
        $sql = "UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $hashed_password, $id_usuario);
        
        if ($stmt->execute()) {
            responder(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
        } else {
            responder(['success' => false, 'message' => 'Error al actualizar contraseña']);
        }
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>