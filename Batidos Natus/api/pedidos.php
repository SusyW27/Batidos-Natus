<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'guardar':
        $id_usuario = intval($data['id_usuario'] ?? 0);
        $productos = $data['productos'] ?? [];
        $total = floatval($data['total'] ?? 0);
        $observaciones = $data['observaciones'] ?? '';
        
        if ($id_usuario == 0 || empty($productos)) {
            responder(['success' => false, 'message' => 'Datos incompletos']);
        }
        
        $conn->begin_transaction();
        try {
            $sql = "INSERT INTO pedidos (id_usuario, total, observaciones, fecha, estado) 
                    VALUES (?, ?, ?, NOW(), 'Pendiente')";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ids", $id_usuario, $total, $observaciones);
            $stmt->execute();
            $id_pedido = $conn->insert_id;
        
            $numero_pedido = '#BAT-' . str_pad($id_pedido, 4, '0', STR_PAD_LEFT);
            $sql = "UPDATE pedidos SET numero_pedido = ? WHERE id_pedido = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("si", $numero_pedido, $id_pedido);
            $stmt->execute();
        
            foreach ($productos as $item) {
                $id_producto = intval($item['id'] ?? 0);
                $cantidad = intval($item['quantity'] ?? 0);
                $precio = floatval($item['price'] ?? 0);
                
                $check_sql = "SELECT id_producto FROM productos WHERE id_producto = ? AND activo = 1";
                $check_stmt = $conn->prepare($check_sql);
                $check_stmt->bind_param("i", $id_producto);
                $check_stmt->execute();
                $check_result = $check_stmt->get_result();
                
                if ($check_result->num_rows === 0) {
                    throw new Exception("El producto con ID $id_producto no existe en el inventario");
                }
                
                $sql = "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) 
                        VALUES (?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iiid", $id_pedido, $id_producto, $cantidad, $precio);
                $stmt->execute();
            }
            
            $conn->commit();
            
            responder([
                'success' => true,
                'message' => 'Pedido guardado',
                'id_pedido' => $id_pedido,
                'numero' => $numero_pedido,
                'estado' => 'Pendiente'
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            responder([
                'success' => false, 
                'message' => 'Error al guardar pedido: ' . $e->getMessage()
            ]);
        }
        break;
    
    case 'listar':
        $id_usuario = intval($data['id_usuario'] ?? 0);
        
        $sql = "SELECT DISTINCT p.id_pedido, p.numero_pedido, p.fecha, p.total, p.estado,
                       p.metodo_pago, p.observaciones
                FROM pedidos p
                WHERE p.id_usuario = $id_usuario 
                ORDER BY p.fecha DESC";
        
        $result = $conn->query($sql);
        $pedidos = [];
        
        while ($row = $result->fetch_assoc()) {
            if (empty($row['numero_pedido'])) {
                $row['numero_pedido'] = '#BAT-' . str_pad($row['id_pedido'], 4, '0', STR_PAD_LEFT);
            }
            
            $detalle = [];
            $sql2 = "SELECT DISTINCT p.nombre, dp.cantidad, dp.precio_unitario 
                     FROM detalle_pedido dp 
                     JOIN productos p ON dp.id_producto = p.id_producto 
                     WHERE dp.id_pedido = " . $row['id_pedido'];
            $result2 = $conn->query($sql2);
            while ($row2 = $result2->fetch_assoc()) {
                $detalle[] = $row2;
            }
            $row['productos'] = $detalle;
            $pedidos[] = $row;
        }
        
        responder(['success' => true, 'pedidos' => $pedidos]);
        break;
    
    case 'cambiar_estado':
        $id_pedido = intval($data['id_pedido'] ?? 0);
        $estado = $data['estado'] ?? '';
        
        if ($id_pedido == 0 || empty($estado)) {
            responder(['success' => false, 'message' => 'Datos incompletos']);
        }
        
        $estado = ucfirst(strtolower($estado));
        $estados_validos = ['Pendiente', 'Pagado', 'Cancelado'];
        
        if (!in_array($estado, $estados_validos)) {
            responder(['success' => false, 'message' => 'Estado no válido. Usa: Pendiente, Pagado, Cancelado']);
        }
        
        $sql_check = "SELECT estado FROM pedidos WHERE id_pedido = ?";
        $stmt = $conn->prepare($sql_check);
        $stmt->bind_param("i", $id_pedido);
        $stmt->execute();
        $result = $stmt->get_result();
        $pedido_actual = $result->fetch_assoc();
        
        if ($pedido_actual) {
            $estado_actual = $pedido_actual['estado'];
            if (($estado_actual === 'Pagado' || $estado_actual === 'Cancelado') && $estado === 'Pendiente') {
                responder(['success' => false, 'message' => 'No se puede revertir un pedido ' . $estado_actual]);
            }
        }
        
        $sql = "UPDATE pedidos SET estado = ? WHERE id_pedido = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $estado, $id_pedido);
        
        if ($stmt->execute()) {
            responder(['success' => true, 'message' => 'Estado actualizado a ' . $estado]);
        } else {
            responder(['success' => false, 'message' => 'Error al actualizar estado']);
        }
        break;
    
    case 'obtener':
        $id_pedido = intval($data['id_pedido'] ?? 0);
        
        if ($id_pedido == 0) {
            responder(['success' => false, 'message' => 'Pedido no especificado']);
        }
        
        $sql = "SELECT p.*, u.nombre AS cliente 
                FROM pedidos p
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                WHERE p.id_pedido = $id_pedido";
        $result = $conn->query($sql);
        $pedido = $result->fetch_assoc();
        
        if ($pedido) {
            if (empty($pedido['numero_pedido'])) {
                $pedido['numero_pedido'] = '#BAT-' . str_pad($pedido['id_pedido'], 4, '0', STR_PAD_LEFT);
            }
            
            $sql2 = "SELECT DISTINCT p.nombre, dp.cantidad, dp.precio_unitario 
                     FROM detalle_pedido dp 
                     JOIN productos p ON dp.id_producto = p.id_producto 
                     WHERE dp.id_pedido = $id_pedido";
            $result2 = $conn->query($sql2);
            $productos = [];
            while ($row = $result2->fetch_assoc()) {
                $productos[] = $row;
            }
            $pedido['productos'] = $productos;
            responder(['success' => true, 'pedido' => $pedido]);
        } else {
            responder(['success' => false, 'message' => 'Pedido no encontrado']);
        }
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>