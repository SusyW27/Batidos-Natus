<?php
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'batidos_natus';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false, 
        'message' => 'Error de conexión a la base de datos: ' . $conn->connect_error
    ]));
}

$conn->set_charset("utf8mb4");

function responder($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function obtenerIdUsuario($nombre, $conn) {
    $sql = "SELECT id_usuario FROM usuarios WHERE nombre = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $nombre);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        return $row['id_usuario'];
    }
    return 0;
}
?>