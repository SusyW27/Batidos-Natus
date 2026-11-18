<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'buscar':
        $fecha_desde = $data['fecha_desde'] ?? '';
        $fecha_hasta = $data['fecha_hasta'] ?? '';
        $estado = $data['estado'] ?? '';
        $cliente = $data['cliente'] ?? '';
        $numero_pedido = $data['numero_pedido'] ?? '';
    
        $sql = "SELECT DISTINCT p.id_pedido, p.numero_pedido, p.fecha, p.total, p.estado,
                       u.nombre AS cliente,
                       GROUP_CONCAT(DISTINCT CONCAT(pr.nombre, ' x', dp.cantidad) SEPARATOR ', ') AS productos
                FROM pedidos p
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                JOIN productos pr ON dp.id_producto = pr.id_producto
                WHERE 1=1";
        
        $params = [];
        $types = "";
        
        if (!empty($fecha_desde)) {
            $sql .= " AND DATE(p.fecha) >= ?";
            $params[] = $fecha_desde;
            $types .= "s";
        }
        
        if (!empty($fecha_hasta)) {
            $sql .= " AND DATE(p.fecha) <= ?";
            $params[] = $fecha_hasta;
            $types .= "s";
        }
        
        if (!empty($estado) && $estado !== 'todos') {
            $estadoNormalizado = ucfirst(strtolower($estado));
            $sql .= " AND p.estado = ?";
            $params[] = $estadoNormalizado;
            $types .= "s";
        }
        
        if (!empty($cliente)) {
            $sql .= " AND u.nombre LIKE ?";
            $params[] = "%" . $cliente . "%";
            $types .= "s";
        }
        
        if (!empty($numero_pedido)) {
            $sql .= " AND p.numero_pedido LIKE ?";
            $params[] = "%" . $numero_pedido . "%";
            $types .= "s";
        }
        
        $sql .= " GROUP BY p.id_pedido ORDER BY p.fecha DESC";
        
        $stmt = $conn->prepare($sql);
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $pedidos = [];
        while ($row = $result->fetch_assoc()) {
            if ($row['estado']) {
                $row['estado'] = ucfirst(strtolower($row['estado']));
            }
            $pedidos[] = $row;
        }
        
        responder([
            'success' => true,
            'pedidos' => $pedidos,
            'total' => count($pedidos)
        ]);
        break;
    
    case 'clientes':
        $sql = "SELECT DISTINCT u.nombre 
                FROM usuarios u
                JOIN pedidos p ON u.id_usuario = p.id_usuario
                ORDER BY u.nombre ASC";
        
        $result = $conn->query($sql);
        $clientes = [];
        while ($row = $result->fetch_assoc()) {
            $clientes[] = $row['nombre'];
        }
        
        responder([
            'success' => true,
            'clientes' => $clientes
        ]);
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>