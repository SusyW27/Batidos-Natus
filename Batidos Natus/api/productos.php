<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

if (empty($action) && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = 'listar';
}

switch ($action) {
    case 'listar':
        $sql = "SELECT id_producto, nombre, descripcion, categoria, precio, stock, imagen_url 
                FROM productos 
                WHERE activo = 1 
                ORDER BY nombre ASC";
        
        $result = $conn->query($sql);
        $productos = [];
        
        while ($row = $result->fetch_assoc()) {
            $productos[] = [
                'id_producto' => $row['id_producto'],
                'nombre' => $row['nombre'],
                'descripcion' => $row['descripcion'] ?? '',
                'categoria' => $row['categoria'] ?? 'Frutales',
                'precio' => floatval($row['precio']),
                'stock' => intval($row['stock']),
                'imagen_url' => $row['imagen_url'] ?: 'img/default.jpg'
            ];
        }
        
        responder(['success' => true, 'productos' => $productos]);
        break;
    
    case 'crear':
        $nombre = $data['nombre'] ?? '';
        $descripcion = $data['descripcion'] ?? '';
        $categoria = $data['categoria'] ?? 'Frutales';
        $precio = floatval($data['precio'] ?? 0);
        $stock = intval($data['stock'] ?? 0);
        $imagen_base64 = $data['imagen_base64'] ?? '';
        $imagen_url = 'img/default.jpg';
        
        if (empty($nombre) || $precio <= 0) {
            responder(['success' => false, 'message' => 'Nombre y precio son requeridos']);
        }
        
        if (!empty($imagen_base64)) {
            $upload_dir = '../img/productos/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $imagen_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $imagen_base64));
            
            $extension = 'jpg';
            if (strpos($imagen_base64, 'data:image/png') === 0) $extension = 'png';
            if (strpos($imagen_base64, 'data:image/webp') === 0) $extension = 'webp';
            if (strpos($imagen_base64, 'data:image/jpeg') === 0) $extension = 'jpg';
            
            $nombre_limpio = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $nombre)));
            $nombre_archivo = $nombre_limpio . '-' . time() . '.' . $extension;
            $ruta_completa = $upload_dir . $nombre_archivo;
            
            if (file_put_contents($ruta_completa, $imagen_data)) {
                $imagen_url = 'img/productos/' . $nombre_archivo;
            }
        }
        
        $sql = "INSERT INTO productos (nombre, descripcion, categoria, precio, stock, imagen_url, activo) 
                VALUES (?, ?, ?, ?, ?, ?, 1)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssdss", $nombre, $descripcion, $categoria, $precio, $stock, $imagen_url);
        
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            responder([
                'success' => true,
                'message' => 'Producto creado correctamente',
                'id' => $id,
                'producto' => [
                    'id_producto' => $id,
                    'nombre' => $nombre,
                    'descripcion' => $descripcion,
                    'categoria' => $categoria,
                    'precio' => $precio,
                    'stock' => $stock,
                    'imagen_url' => $imagen_url
                ]
            ]);
        } else {
            responder(['success' => false, 'message' => 'Error al crear producto: ' . $conn->error]);
        }
        break;
    
    case 'actualizar':
        $id = intval($data['id'] ?? 0);
        $nombre = trim($data['nombre'] ?? '');
        $descripcion = trim($data['descripcion'] ?? '');
        $categoria = trim($data['categoria'] ?? 'Frutales');
        $precio = floatval($data['precio'] ?? 0);
        $stock = intval($data['stock'] ?? 0);
        $imagen_base64 = $data['imagen_base64'] ?? '';
        $imagen_actual = $data['imagen_actual'] ?? 'img/default.jpg';
        $activo = isset($data['activo']) ? ($data['activo'] ? 1 : 0) : 1;
        
        error_log("ACTUALIZACIÓN");
        error_log("ID: $id");
        error_log("Nombre: $nombre");
        error_log("Categoría: $categoria");
        error_log("Precio: $precio");
        error_log("Stock: $stock");
        error_log("Activo: $activo");
        
        if ($id == 0 || empty($nombre)) {
            responder(['success' => false, 'message' => 'ID y nombre son requeridos']);
        }
        
        $imagen_url = $imagen_actual;
        
        if (!empty($imagen_base64)) {
            $upload_dir = '../img/productos/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $imagen_data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $imagen_base64));
            
            $extension = 'jpg';
            if (strpos($imagen_base64, 'data:image/png') === 0) $extension = 'png';
            if (strpos($imagen_base64, 'data:image/webp') === 0) $extension = 'webp';
            if (strpos($imagen_base64, 'data:image/jpeg') === 0) $extension = 'jpg';
            
            $nombre_limpio = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $nombre)));
            $nombre_archivo = $nombre_limpio . '-' . time() . '.' . $extension;
            $ruta_completa = $upload_dir . $nombre_archivo;
            
            if (file_put_contents($ruta_completa, $imagen_data)) {
                if ($imagen_actual !== 'img/default.jpg' && file_exists('../' . $imagen_actual)) {
                    unlink('../' . $imagen_actual);
                }
                $imagen_url = 'img/productos/' . $nombre_archivo;
            }
        }
        
        $sql = "UPDATE productos SET 
                    nombre = ?, 
                    descripcion = ?, 
                    categoria = ?,
                    precio = ?, 
                    stock = ?, 
                    imagen_url = ?,
                    activo = ?
                WHERE id_producto = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssdisii", 
            $nombre,
            $descripcion,
            $categoria,
            $precio,
            $stock,
            $imagen_url,
            $activo,
            $id
        );
        
        error_log("Categoría a guardar: $categoria");
        
        if ($stmt->execute()) {
            error_log("ACTUALIZACIÓN EXITOSA para ID: $id, Categoría: $categoria");
            responder([
                'success' => true,
                'message' => 'Producto actualizado correctamente'
            ]);
        } else {
            error_log("ERROR en SQL: " . $stmt->error);
            responder(['success' => false, 'message' => 'Error al actualizar producto: ' . $stmt->error]);
        }
        break;
    
    case 'eliminar':
        $id = intval($data['id'] ?? 0);
        
        if ($id == 0) {
            responder(['success' => false, 'message' => 'ID de producto requerido']);
        }
        
        $sql = "SELECT imagen_url FROM productos WHERE id_producto = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $producto = $result->fetch_assoc();
        
        if ($producto && $producto['imagen_url'] !== 'img/default.jpg') {
            $ruta_imagen = '../' . $producto['imagen_url'];
            if (file_exists($ruta_imagen)) {
                unlink($ruta_imagen);
            }
        }
        
        $sql = "UPDATE productos SET activo = 0, stock = 0 WHERE id_producto = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            responder([
                'success' => true,
                'message' => 'Producto eliminado correctamente'
            ]);
        } else {
            responder(['success' => false, 'message' => 'Error al eliminar producto: ' . $conn->error]);
        }
        break;
    
    case 'obtener':
        $id = intval($data['id'] ?? 0);
        
        if ($id == 0) {
            responder(['success' => false, 'message' => 'ID de producto requerido']);
        }
        
        $sql = "SELECT id_producto, nombre, descripcion, categoria, precio, stock, imagen_url, activo 
                FROM productos 
                WHERE id_producto = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            responder([
                'success' => true,
                'producto' => [
                    'id_producto' => $row['id_producto'],
                    'nombre' => $row['nombre'],
                    'descripcion' => $row['descripcion'] ?? '',
                    'categoria' => $row['categoria'] ?? 'Frutales',
                    'precio' => floatval($row['precio']),
                    'stock' => intval($row['stock']),
                    'imagen_url' => $row['imagen_url'],
                    'activo' => $row['activo'] == 1
                ]
            ]);
        } else {
            responder(['success' => false, 'message' => 'Producto no encontrado']);
        }
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>