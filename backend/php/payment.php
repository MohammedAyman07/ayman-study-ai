<?php
/**
 * AYMAN STUDY AI - Payment Service (Razorpay PHP Backend)
 * Configured securely via Environment Variables
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

// Auth header
$authHeader = '';
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
}
if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
}
if (empty($authHeader) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}
if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}
$tokenPayload = json_decode(base64_decode($matches[1]), true);
if (!$tokenPayload || !isset($tokenPayload['user_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Invalid token"]);
    exit;
}
$user_id = $tokenPayload['user_id'];

// Secure Credentials from environment
$RAZORPAY_KEY_ID = getenv('RAZORPAY_KEY_ID') ?: ($_ENV['RAZORPAY_KEY_ID'] ?? '');
$RAZORPAY_KEY_SECRET = getenv('RAZORPAY_KEY_SECRET') ?: ($_ENV['RAZORPAY_KEY_SECRET'] ?? '');

if (empty($RAZORPAY_KEY_ID) || empty($RAZORPAY_KEY_SECRET)) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Payment credentials not configured"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

if ($action === 'create_order') {
    $base_amount = $input['amount'] ?? 99;
    $currency_code = $input['currency'] ?? 'INR';
    $amount_in_smallest_unit = intval(round($base_amount * 100));
    
    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_USERPWD, $RAZORPAY_KEY_ID . ":" . $RAZORPAY_KEY_SECRET);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'amount' => $amount_in_smallest_unit,
        'currency' => $currency_code,
        'receipt' => 'rcpt_' . $user_id . '_' . time()
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $order = json_decode($response, true);
        $stmt = $pdo->prepare("INSERT INTO payments (user_id, razorpay_order_id, amount, credits_added, status) VALUES (:uid, :oid, :amt, 100, 'created')");
        $stmt->execute([
            'uid' => $user_id,
            'oid' => $order['id'],
            'amt' => $base_amount
        ]);
        echo json_encode(["status" => "success", "order" => $order]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Failed to create Razorpay Order"]);
    }
} elseif ($action === 'verify_payment') {
    $r_payment_id = $input['razorpay_payment_id'] ?? '';
    $r_order_id = $input['razorpay_order_id'] ?? '';
    $r_signature = $input['razorpay_signature'] ?? '';
    
    $generated_signature = hash_hmac('sha256', $r_order_id . "|" . $r_payment_id, $RAZORPAY_KEY_SECRET);
    
    if ($generated_signature === $r_signature) {
        $stmt = $pdo->prepare("UPDATE payments SET status = 'paid', razorpay_payment_id = :pay_id WHERE razorpay_order_id = :order_id AND status = 'created'");
        $stmt->execute(['pay_id' => $r_payment_id, 'order_id' => $r_order_id]);
        
        if ($stmt->rowCount() > 0) {
            $stmt = $pdo->prepare("UPDATE users SET credits = credits + 100 WHERE id = :uid");
            $stmt->execute(['uid' => $user_id]);
            
            $stmt = $pdo->prepare("SELECT credits FROM users WHERE id = :uid");
            $stmt->execute(['uid' => $user_id]);
            $new_credits = $stmt->fetchColumn();
            
            echo json_encode(["status" => "success", "new_credits" => $new_credits]);
        } else {
            echo json_encode(["status" => "error", "message" => "Order already processed or not found."]);
        }
    } else {
        $stmt = $pdo->prepare("UPDATE payments SET status = 'failed' WHERE razorpay_order_id = :order_id");
        $stmt->execute(['order_id' => $r_order_id]);
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Payment verification failed."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Unknown action"]);
}
?>
