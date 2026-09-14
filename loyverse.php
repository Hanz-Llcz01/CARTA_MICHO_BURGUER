<?php
// loyverse.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Si necesitas habilitar CORS

// ⚠️ PEGA AQUÍ TU ACCESS TOKEN DE LOYVERSE
$access_token = "TU_ACCESS_TOKEN_AQUI"; 

// Obtener los datos del carrito enviados desde main.js
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['items'])) {
    echo json_encode(['success' => false, 'message' => 'No se recibieron datos válidos.']);
    exit;
}

$items = $data['items'];

/*
  --------------------------------------------------------------------------
  ¡IMPORTANTE SOBRE LA API DE LOYVERSE!
  --------------------------------------------------------------------------
  Loyverse requiere que cada producto que envíes tenga un "item_id" válido 
  y que exista en tu base de datos de Loyverse.
  
  Para que este código funcione al 100% en la vida real, debes:
  1. Hacer una petición a GET /items en Loyverse para obtener los IDs reales.
  2. Mapear esos IDs reales en tu archivo js/data.js
  
  A continuación te muestro la ESTRUCTURA EXACTA de cómo se envía un recibo.
*/

// Construyendo el arreglo de líneas (productos) para Loyverse
$receipt_lines = [];
foreach ($items as $item) {
    $receipt_lines[] = [
        // "item_id" => "ID_REAL_DE_LOYVERSE", // Descomentar cuando tengas los IDs reales
        "item_name" => $item['name'],
        "quantity" => $item['qty'],
        "price" => $item['price'],
        "total_money" => $item['price'] * $item['qty']
    ];
}

// Simulando el envío a Loyverse (Solo para el prototipo)
// En producción, aquí se usaría cURL para hacer POST a https://api.loyverse.com/v1.0/receipts
$success = true;

if ($success) {
    echo json_encode([
        'success' => true, 
        'message' => 'Pedido simulado correctamente.',
        'debug_data_received' => $receipt_lines
    ]);
} else {
    // Ejemplo de error
    echo json_encode(['success' => false, 'message' => 'Error al conectar con Loyverse.']);
}
?>
