<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'stock_bajo':
        $limite = intval($data['limite'] ?? 5);
        
        $sql = "SELECT id_producto, nombre, stock 
                FROM productos 
                WHERE stock <= ? AND activo = 1
                ORDER BY stock ASC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limite);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $productos = [];
        while ($row = $result->fetch_assoc()) {
            $productos[] = [
                'id' => $row['id_producto'],
                'nombre' => $row['nombre'],
                'stock' => intval($row['stock'])
            ];
        }
        
        responder([
            'success' => true,
            'productos' => $productos,
            'total' => count($productos)
        ]);
        break;
    
    case 'contar_stock_bajo':
        $limite = intval($data['limite'] ?? 5);
        
        $sql = "SELECT COUNT(*) as total 
                FROM productos 
                WHERE stock <= ? AND activo = 1";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limite);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        responder([
            'success' => true,
            'total' => intval($row['total'] ?? 0)
        ]);
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>