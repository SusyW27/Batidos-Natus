<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'ventas_semana':
        $sql = "SELECT 
                    DATE(fecha) as fecha,
                    COUNT(*) as cantidad_pedidos,
                    SUM(total) as total_ventas
                FROM pedidos 
                WHERE estado = 'Pagado'
                AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(fecha)
                ORDER BY fecha ASC";
        
        $result = $conn->query($sql);
        $datos = [];
        
        while ($row = $result->fetch_assoc()) {
            $datos[] = [
                'fecha' => date('d/m', strtotime($row['fecha'])),
                'cantidad' => intval($row['cantidad_pedidos']),
                'total' => floatval($row['total_ventas'])
            ];
        }
        
        responder([
            'success' => true,
            'datos' => $datos
        ]);
        break;
    
    case 'estados_pedidos':
        $sql = "SELECT 
                    estado,
                    COUNT(*) as cantidad
                FROM pedidos 
                GROUP BY estado";
        
        $result = $conn->query($sql);
        $datos = [];
        $estados = ['Pendiente' => 0, 'Pagado' => 0, 'Cancelado' => 0];
        
        while ($row = $result->fetch_assoc()) {
            $estado = $row['estado'] ?? 'Pendiente';
            $estados[$estado] = intval($row['cantidad']);
        }
        
        responder([
            'success' => true,
            'datos' => $estados
        ]);
        break;
    
    case 'ventas_meses':
        $sql = "SELECT 
                    DATE_FORMAT(fecha, '%Y-%m') as mes,
                    SUM(total) as total_ventas,
                    COUNT(*) as cantidad_pedidos
                FROM pedidos 
                WHERE estado = 'Pagado'
                AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(fecha, '%Y-%m')
                ORDER BY mes ASC";
        
        $result = $conn->query($sql);
        $datos = [];
        
        while ($row = $result->fetch_assoc()) {
            $mes = $row['mes'];
            $nombre_mes = date('M', strtotime($mes . '-01'));
            $datos[] = [
                'mes' => $nombre_mes,
                'total' => floatval($row['total_ventas']),
                'cantidad' => intval($row['cantidad_pedidos'])
            ];
        }
        
        responder([
            'success' => true,
            'datos' => $datos
        ]);
        break;
    
    case 'top_productos':
        $sql = "SELECT 
                    p.nombre,
                    SUM(dp.cantidad) as total_vendido
                FROM detalle_pedido dp
                JOIN pedidos pe ON dp.id_pedido = pe.id_pedido
                JOIN productos p ON dp.id_producto = p.id_producto
                WHERE pe.estado = 'Pagado'
                GROUP BY dp.id_producto
                ORDER BY total_vendido DESC
                LIMIT 5";
        
        $result = $conn->query($sql);
        $datos = [];
        
        while ($row = $result->fetch_assoc()) {
            $datos[] = [
                'nombre' => $row['nombre'],
                'cantidad' => intval($row['total_vendido'])
            ];
        }
        
        responder([
            'success' => true,
            'datos' => $datos
        ]);
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>