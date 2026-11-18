<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'obtener_pedido_pendiente':
        $id_usuario = intval($data['id_usuario'] ?? 0);
        
        if ($id_usuario == 0) {
            responder(['success' => false, 'message' => 'Usuario no especificado']);
        }
        
        $sql = "SELECT p.id_pedido, p.fecha, p.total, p.estado, p.observaciones,
                       u.nombre AS cliente
                FROM pedidos p
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                WHERE p.id_usuario = $id_usuario 
                  AND p.estado = 'Pendiente'
                ORDER BY p.fecha DESC 
                LIMIT 1";
        
        $result = $conn->query($sql);
        
        if ($result->num_rows === 0) {
            responder(['success' => false, 'message' => 'No hay pedidos pendientes para facturar']);
        }
        
        $pedido = $result->fetch_assoc();
        
        $sql_detalle = "SELECT dp.id_producto, p.nombre, dp.cantidad, dp.precio_unitario,
                               (dp.cantidad * dp.precio_unitario) AS subtotal
                        FROM detalle_pedido dp
                        JOIN productos p ON dp.id_producto = p.id_producto
                        WHERE dp.id_pedido = " . $pedido['id_pedido'];
        
        $result_detalle = $conn->query($sql_detalle);
        $productos = [];
        while ($row = $result_detalle->fetch_assoc()) {
            $productos[] = $row;
        }
        
        $pedido['productos'] = $productos;
        
        responder([
            'success' => true,
            'pedido' => $pedido
        ]);
        break;
    
    case 'procesar_pago':
        $id_usuario = intval($data['id_usuario'] ?? 0);
        $id_pedido = intval($data['id_pedido'] ?? 0);
        $metodo_pago = $data['metodo_pago'] ?? 'efectivo';
        $referencia = $data['referencia'] ?? '';
        $cardholder = $data['cardholder'] ?? '';
        $creado_por = $data['creado_por'] ?? 'sistema';
        
        if ($id_usuario == 0 || $id_pedido == 0) {
            responder(['success' => false, 'message' => 'Datos incompletos']);
        }
        
        $conn->begin_transaction();
        
        try {
            $sql = "SELECT id_pedido, total FROM pedidos 
                    WHERE id_pedido = $id_pedido AND id_usuario = $id_usuario 
                    AND estado = 'Pendiente'";
            $result = $conn->query($sql);
            
            if ($result->num_rows === 0) {
                responder(['success' => false, 'message' => 'Pedido no encontrado o ya procesado']);
            }
            
            $pedido = $result->fetch_assoc();
            $total = $pedido['total'];
            
            $anio = date('Y');
            $sql = "SELECT MAX(CAST(SUBSTRING(numero_factura, -4) AS UNSIGNED)) AS ultimo 
                    FROM facturas 
                    WHERE YEAR(fecha_emision) = $anio";
            $result = $conn->query($sql);
            $row = $result->fetch_assoc();
            $ultimo = $row['ultimo'] ?? 0;
            
            $nuevo_numero = $ultimo + 1;
            $numero = str_pad($nuevo_numero, 4, '0', STR_PAD_LEFT);
            $numero_factura = "FAC-$anio-$numero";
            
            $sql_check = "SELECT id_factura FROM facturas WHERE numero_factura = '$numero_factura'";
            $check = $conn->query($sql_check);
            if ($check->num_rows > 0) {
                $sql = "SELECT MAX(CAST(SUBSTRING(numero_factura, -4) AS UNSIGNED)) AS ultimo 
                        FROM facturas";
                $result = $conn->query($sql);
                $row = $result->fetch_assoc();
                $ultimo = $row['ultimo'] ?? 0;
                $nuevo_numero = $ultimo + 1;
                $numero = str_pad($nuevo_numero, 4, '0', STR_PAD_LEFT);
                $numero_factura = "FAC-$anio-$numero";
            }
            
            $sql = "INSERT INTO facturas (
                        id_pedido, id_usuario, numero_factura, 
                        subtotal, impuesto, total, 
                        metodo_pago, estado_pago, referencia_pago, 
                        creado_por
                    ) VALUES (
                        $id_pedido, $id_usuario, '$numero_factura',
                        $total, 0.00, $total,
                        '$metodo_pago', 'pagado', '$referencia',
                        '$creado_por'
                    )";
            $conn->query($sql);
            $id_factura = $conn->insert_id;
            
            $sql = "INSERT INTO detalle_factura (
                        id_factura, id_producto, nombre_producto, 
                        cantidad, precio_unitario, subtotal
                    )
                    SELECT 
                        $id_factura, dp.id_producto, p.nombre,
                        dp.cantidad, dp.precio_unitario, 
                        (dp.cantidad * dp.precio_unitario)
                    FROM detalle_pedido dp
                    JOIN productos p ON dp.id_producto = p.id_producto
                    WHERE dp.id_pedido = $id_pedido";
            $conn->query($sql);
            
            $sql_stock = "UPDATE productos p
                          JOIN detalle_pedido dp ON p.id_producto = dp.id_producto
                          SET p.stock = p.stock - dp.cantidad
                          WHERE dp.id_pedido = $id_pedido";
            $conn->query($sql_stock);
            
            $sql = "UPDATE pedidos SET estado = 'Pagado', metodo_pago = '$metodo_pago' 
                    WHERE id_pedido = $id_pedido";
            $conn->query($sql);
            
            if ($metodo_pago === 'tarjeta') {
                $sql = "INSERT INTO pagos (
                            id_factura, id_pedido, id_usuario, 
                            monto, metodo, estado, transaccion_id,
                            ip_cliente, user_agent
                        ) VALUES (
                            $id_factura, $id_pedido, $id_usuario,
                            $total, 'tarjeta', 'aprobado', 
                            '" . ($referencia ?: 'SIM-' . uniqid()) . "',
                            '" . ($_SERVER['REMOTE_ADDR'] ?? '') . "',
                            '" . ($_SERVER['HTTP_USER_AGENT'] ?? '') . "'
                        )";
                $conn->query($sql);
            }
            
            $conn->commit();
            
            responder([
                'success' => true,
                'message' => 'Pago procesado exitosamente',
                'numero_factura' => $numero_factura,
                'id_factura' => $id_factura,
                'total' => floatval($total)
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            responder([
                'success' => false,
                'message' => 'Error al procesar el pago: ' . $e->getMessage()
            ]);
        }
        break;
    
    case 'historial_empleado':
        $id_usuario = intval($data['id_usuario'] ?? 0);
        
        if ($id_usuario == 0) {
            responder(['success' => false, 'message' => 'Usuario no especificado']);
        }
        
        $sql_nombre = "SELECT nombre FROM usuarios WHERE id_usuario = $id_usuario";
        $result_nombre = $conn->query($sql_nombre);
        $nombre_empleado = $result_nombre->fetch_assoc()['nombre'] ?? '';
        
        $sql = "SELECT f.*, p.numero_pedido, u.nombre AS cliente
                FROM facturas f
                JOIN pedidos p ON f.id_pedido = p.id_pedido
                JOIN usuarios u ON f.id_usuario = u.id_usuario
                WHERE f.creado_por = '$nombre_empleado'
                ORDER BY f.fecha_emision DESC";
        
        $result = $conn->query($sql);
        $facturas = [];
        
        while ($row = $result->fetch_assoc()) {
            $facturas[] = $row;
        }
        
        responder([
            'success' => true,
            'facturas' => $facturas
        ]);
        break;

    case 'procesar_pago_empleado':
        $id_pedido = intval($data['id_pedido'] ?? 0);
        $metodo_pago = $data['metodo_pago'] ?? 'efectivo';
        $moneda = $data['moneda'] ?? 'USD';
        $monto_bs = $data['monto_bs'] ?? '';
        $creado_por = $data['creado_por'] ?? 'empleado';
        $id_usuario = intval($data['id_usuario'] ?? 0);
        
        if ($id_pedido == 0) {
            responder(['success' => false, 'message' => 'Pedido no especificado']);
        }
        
        $conn->begin_transaction();
        
        try {
            $sql = "SELECT id_pedido, total, id_usuario FROM pedidos 
                    WHERE id_pedido = $id_pedido 
                    AND estado = 'Pendiente'";
            $result = $conn->query($sql);
            
            if ($result->num_rows === 0) {
                responder(['success' => false, 'message' => 'Pedido no encontrado o ya procesado']);
            }
            
            $pedido = $result->fetch_assoc();
            $total = $pedido['total'];
            $id_usuario_pedido = $pedido['id_usuario'];
            
            $anio = date('Y');
            $sql = "SELECT MAX(CAST(SUBSTRING(numero_factura, -4) AS UNSIGNED)) AS ultimo 
                    FROM facturas 
                    WHERE YEAR(fecha_emision) = $anio";
            $result = $conn->query($sql);
            $row = $result->fetch_assoc();
            $ultimo = $row['ultimo'] ?? 0;
            
            $nuevo_numero = $ultimo + 1;
            $numero = str_pad($nuevo_numero, 4, '0', STR_PAD_LEFT);
            $numero_factura = "FAC-$anio-$numero";
            
            $sql_check = "SELECT id_factura FROM facturas WHERE numero_factura = '$numero_factura'";
            $check = $conn->query($sql_check);
            if ($check->num_rows > 0) {
                $sql = "SELECT MAX(CAST(SUBSTRING(numero_factura, -4) AS UNSIGNED)) AS ultimo 
                        FROM facturas";
                $result = $conn->query($sql);
                $row = $result->fetch_assoc();
                $ultimo = $row['ultimo'] ?? 0;
                $nuevo_numero = $ultimo + 1;
                $numero = str_pad($nuevo_numero, 4, '0', STR_PAD_LEFT);
                $numero_factura = "FAC-$anio-$numero";
            }
            
            $observaciones_factura = $data['observaciones'] ?? '';
            if ($moneda === 'Bs' && !empty($monto_bs)) {
                $observaciones_factura .= " | Monto en Bs.: " . number_format(floatval($monto_bs), 2) . " Bs.";
            }
            $observaciones_factura = trim($observaciones_factura);
            
            $sql = "INSERT INTO facturas (
                        id_pedido, id_usuario, numero_factura, 
                        subtotal, impuesto, total, 
                        metodo_pago, estado_pago, 
                        observaciones, creado_por
                    ) VALUES (
                        $id_pedido, $id_usuario_pedido, '$numero_factura',
                        $total, 0.00, $total,
                        '$metodo_pago', 'pagado',
                        '" . addslashes($observaciones_factura) . "',
                        '$creado_por'
                    )";
            $conn->query($sql);
            $id_factura = $conn->insert_id;
            
            $sql = "INSERT INTO detalle_factura (
                        id_factura, id_producto, nombre_producto, 
                        cantidad, precio_unitario, subtotal
                    )
                    SELECT 
                        $id_factura, dp.id_producto, p.nombre,
                        dp.cantidad, dp.precio_unitario, 
                        (dp.cantidad * dp.precio_unitario)
                    FROM detalle_pedido dp
                    JOIN productos p ON dp.id_producto = p.id_producto
                    WHERE dp.id_pedido = $id_pedido";
            $conn->query($sql);
            
            $sql_stock = "UPDATE productos p
                          JOIN detalle_pedido dp ON p.id_producto = dp.id_producto
                          SET p.stock = p.stock - dp.cantidad
                          WHERE dp.id_pedido = $id_pedido";
            $conn->query($sql_stock);
            
            $sql = "UPDATE pedidos SET estado = 'Pagado', metodo_pago = '$metodo_pago' 
                    WHERE id_pedido = $id_pedido";
            $conn->query($sql);
            
            $conn->commit();
            
            responder([
                'success' => true,
                'message' => 'Pago procesado exitosamente',
                'numero_factura' => $numero_factura,
                'id_factura' => $id_factura,
                'total' => floatval($total),
                'moneda' => $moneda,
                'monto_bs' => $monto_bs
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            responder([
                'success' => false,
                'message' => 'Error al procesar el pago: ' . $e->getMessage()
            ]);
        }
        break;
    
    default:
        responder(['success' => false, 'message' => 'Acción no válida']);
}
?>