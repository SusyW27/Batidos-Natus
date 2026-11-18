<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'pedidos_activos':
        $sql = "SELECT DISTINCT p.id_pedido, p.numero_pedido, p.fecha, p.total, p.estado,
                       u.nombre AS cliente,
                       GROUP_CONCAT(DISTINCT CONCAT(pr.nombre, ' x', dp.cantidad) SEPARATOR ', ') AS productos
                FROM pedidos p
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                JOIN productos pr ON dp.id_producto = pr.id_producto
                WHERE p.estado = 'Pendiente'
                GROUP BY p.id_pedido
                ORDER BY p.fecha ASC";
        
        $result = $conn->query($sql);
        $pedidos = [];
        
        while ($row = $result->fetch_assoc()) {
            $pedidos[] = $row;
        }
        
        responder([
            'success' => true,
            'pedidos' => $pedidos
        ]);
        break;
    
    case 'historial':
        $sql = "SELECT DISTINCT p.id_pedido, p.numero_pedido, p.fecha, p.total, p.estado,
                       u.nombre AS cliente,
                       GROUP_CONCAT(DISTINCT CONCAT(pr.nombre, ' x', dp.cantidad) SEPARATOR ', ') AS productos
                FROM pedidos p
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                JOIN productos pr ON dp.id_producto = pr.id_producto
                WHERE p.estado IN ('Pagado', 'Cancelado')
                GROUP BY p.id_pedido
                ORDER BY p.fecha DESC
                LIMIT 50";
        
        $result = $conn->query($sql);
        $pedidos = [];
        
        while ($row = $result->fetch_assoc()) {
            $pedidos[] = $row;
        }
        
        responder([
            'success' => true,
            'pedidos' => $pedidos
        ]);
        break;
    
    case 'cambiar_estado':
        $id_pedido = intval($data['id_pedido'] ?? 0);
        $estado = $data['estado'] ?? '';
        $observaciones = $data['observaciones'] ?? '';
        
        if ($id_pedido == 0 || empty($estado)) {
            responder(['success' => false, 'message' => 'Datos incompletos']);
        }
        
        $estado = ucfirst(strtolower($estado));
        $estados_validos = ['Pendiente', 'Pagado', 'Cancelado'];
        
        if (!in_array($estado, $estados_validos)) {
            responder(['success' => false, 'message' => 'Estado no válido. Usa: Pendiente, Pagado, Cancelado']);
        }
        
        $sql = "UPDATE pedidos SET estado = ? WHERE id_pedido = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $estado, $id_pedido);
        
        if ($stmt->execute()) {
            responder([
                'success' => true,
                'message' => 'Estado actualizado correctamente'
            ]);
        } else {
            responder([
                'success' => false,
                'message' => 'Error al actualizar estado: ' . $conn->error
            ]);
        }
        break;
    
    case 'estadisticas':
        $sql_hoy = "SELECT COUNT(*) AS total FROM pedidos WHERE DATE(fecha) = CURDATE()";
        $result_hoy = $conn->query($sql_hoy);
        $hoy = $result_hoy->fetch_assoc();
        
        $sql_estados = "SELECT estado, COUNT(*) AS cantidad FROM pedidos GROUP BY estado";
        $result_estados = $conn->query($sql_estados);
        $estados = [];
        while ($row = $result_estados->fetch_assoc()) {
            $estados[$row['estado']] = intval($row['cantidad']);
        }
        
        $estados_completos = [
            'Pendiente' => $estados['Pendiente'] ?? 0,
            'Pagado' => $estados['Pagado'] ?? 0,
            'Cancelado' => $estados['Cancelado'] ?? 0
        ];
        
        $sql_mes = "SELECT SUM(total) AS total FROM pedidos 
                    WHERE MONTH(fecha) = MONTH(CURDATE()) 
                    AND YEAR(fecha) = YEAR(CURDATE())
                    AND estado = 'Pagado'";
        $result_mes = $conn->query($sql_mes);
        $mes = $result_mes->fetch_assoc();
        
        responder([
            'success' => true,
            'estadisticas' => [
                'totalPedidos' => array_sum($estados_completos),
                'totalVentas' => floatval($mes['total'] ?? 0),
                'porEstado' => $estados_completos
            ]
        ]);
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>