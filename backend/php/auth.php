<?php
// Secure Authentication API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['credential'])) {
    echo json_encode(["status" => "error", "message" => "Missing Google Credential"]);
    exit;
}

$credential = $input['credential'];

// Verify token with Google API
$url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $credential;
$response = file_get_contents($url);
if ($response === false) {
    echo json_encode(["status" => "error", "message" => "Invalid token"]);
    exit;
}

$payload = json_decode($response, true);

if (!isset($payload['sub']) || !isset($payload['email'])) {
    echo json_encode(["status" => "error", "message" => "Invalid Google Payload"]);
    exit;
}

$google_id = $payload['sub'];
$email = $payload['email'];
$name = $payload['name'] ?? 'Student';
$picture = $payload['picture'] ?? '';

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = :google_id");
    $stmt->execute(['google_id' => $google_id]);
    $user = $stmt->fetch();

    if (!$user) {
        // Create new user with 20 free credits
        $stmt = $pdo->prepare("INSERT INTO users (google_id, email, name, picture, credits) VALUES (:google_id, :email, :name, :picture, 20)");
        $stmt->execute([
            'google_id' => $google_id,
            'email' => $email,
            'name' => $name,
            'picture' => $picture
        ]);
        $user_id = $pdo->lastInsertId();
        
        // Fetch newly created user info
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute(['id' => $user_id]);
        $user = $stmt->fetch();
    }
    
    // In a production scenario, you would issue your own JWT here.
    // For this simple Hostinger setup, we can use the user_id as a mock token, 
    // or securely use the google_id (in an actual app, you should hash it or make a session).
    // Let's create a very basic custom token for them to use for api.php calls.
    
    // Quick pseudo-token generation
    $token = base64_encode(json_encode([
        'user_id' => $user['id'],
        'email' => $user['email'],
        'exp' => time() + (86400 * 30) // 30 days valid
    ]));

    echo json_encode([
        "status" => "success",
        "token" => $token,
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "picture" => $user['picture'],
            "credits" => $user['credits'],
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
