<?php
// midtrans_token.php - WordPress.com hosting dışında
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Method not allowed']));
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
$amount = isset($input['amount']) ? floatval($input['amount']) : 0;
$item_name = isset($input['item_name']) ? $input['item_name'] : 'Wix Product';

// 🔑 IDR için integer tutar
$amount = (int) round($amount);

if ($amount < 1000) {
    http_response_code(400);
    exit(json_encode(['error' => 'Invalid amount']));
}

// Create order ID
$order_id = 'WIX-' . time() . '-' . rand(1000, 9999);

// Midtrans parameters
$params = array(
    'transaction_details' => array(
        'order_id' => $order_id,
        'gross_amount' => $amount   // ✅ integer
    ),
    'item_details' => array(
        array(
            'id' => 'ITEM-' . time(),
            'price' => $amount,     // ✅ integer
            'quantity' => 1,
            'name' => $item_name
        )
    ),
    'customer_details' => array(
        'first_name' => 'Customer',
        'email' => 'customer@example.com',
        'phone' => '+6281234567890'
    )
);

// Midtrans API URL (Production)
$api_url = 'https://app.midtrans.com/snap/v1/transactions';
$server_key = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';

// Make API call to Midtrans
$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_URL => $api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($params),
    CURLOPT_HTTPHEADER => array(
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: ' . 'Basic ' . base64_encode($server_key . ':')
    ),
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false
));

$response = curl_exec($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_error = curl_error($curl);
curl_close($curl);

if ($curl_error) {
    http_response_code(500);
    exit(json_encode(['error' => 'Connection error: ' . $curl_error]));
}

if ($http_code !== 201) {
    http_response_code(500);
    exit(json_encode(['error' => 'Payment gateway error: HTTP ' . $http_code]));
}

$response_data = json_decode($response, true);

if (!$response_data || !isset($response_data['token'])) {
    http_response_code(500);
    exit(json_encode(['error' => 'Invalid response from payment gateway']));
}

// Return success response
echo json_encode([
    'success' => true,
    'data' => [
        'token' => $response_data['token'],
        'order_id' => $order_id
    ]
]);
?>
