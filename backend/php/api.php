<?php
/**
 * Ultimate AI Proxy for Ayman StudyAI
 * Handles Google AI Studio (Gemini), Groq, OpenRouter, and Hugging Face Failover.
 * Configured securely via Environment Variables.
 */

// --- CONFIGURATION FROM ENVIRONMENT VARIABLES ---
function getEnvList($varName, $fallback = []) {
    $val = getenv($varName) ?: ($_ENV[$varName] ?? '');
    if (!empty($val)) {
        return array_filter(array_map('trim', explode(',', $val)));
    }
    return $fallback;
}

$GROQ_KEYS = getEnvList('GROQ_API_KEYS');
if (empty($GROQ_KEYS) && ($single = (getenv('GROQ_API_KEY') ?: ($_ENV['GROQ_API_KEY'] ?? '')))) {
    $GROQ_KEYS = [$single];
}

$GEMINI_KEYS = getEnvList('GEMINI_API_KEYS');
if (empty($GEMINI_KEYS) && ($single = (getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '')))) {
    $GEMINI_KEYS = [$single];
}

$OPENROUTER_API_KEY = getenv('OPENROUTER_API_KEY') ?: ($_ENV['OPENROUTER_API_KEY'] ?? '');
$HUGGINGFACE_API_KEY = getenv('HUGGINGFACE_API_KEY') ?: ($_ENV['HUGGINGFACE_API_KEY'] ?? '');

// --- SECURITY HEADERS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- INPUT HANDLING ---
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit;
}

// --- AUTH & CREDIT SYSTEM ---
require_once __DIR__ . '/db.php';

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
$token = $matches[1];
$tokenPayload = json_decode(base64_decode($token), true);

if (!$tokenPayload || !isset($tokenPayload['user_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Invalid token"]);
    exit;
}

$user_id = $tokenPayload['user_id'];
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "User not found"]);
    exit;
}

if ($user['credits'] <= 0) {
    echo json_encode(["status" => "error", "message" => "INSUFFICIENT_CREDITS"]);
    exit;
}

$prompt = $input['prompt'] ?? '';
$systemInstruction = $input['systemInstruction'] ?? '';
$systemInstruction .= "\n\nCRITICAL INSTRUCTION FOR GRAPHS & DIAGRAMS: If the user's question explicitly or implicitly requires a graph, chart, circuit diagram, flowchart, or any visual representation to explain the solution effectively, you MUST generate it using valid Mermaid.js syntax enclosed in a ```mermaid markdown block. Do not use description only; use real Mermaid diagrams.";
$imageData = $input['image'] ?? null; // Base64 string
$mimeType = $input['mimeType'] ?? "image/png";
$subject = $input['subject'] ?? '';
$rawProblem = $input['rawProblem'] ?? '';

// --- WIKIPEDIA AI FOR HISTORY ---
if ($subject === 'history' && !empty($rawProblem)) {
    $searchQuery = urlencode(substr($rawProblem, 0, 150));
    $wikiUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={$searchQuery}&utf8=&format=json&srlimit=1";

    $ch = curl_init($wikiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, "AymanStudyAI/2.0 (contact@aymaninfotech.com)");
    $res = curl_exec($ch);
    curl_close($ch);

    if ($res) {
        $wikiData = json_decode($res, true);
        if (!empty($wikiData['query']['search'])) {
            $title = $wikiData['query']['search'][0]['title'];
            $extractUrl = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=" . urlencode($title) . "&format=json";

            $ch2 = curl_init($extractUrl);
            curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch2, CURLOPT_USERAGENT, "AymanStudyAI/2.0 (contact@aymaninfotech.com)");
            $res2 = curl_exec($ch2);
            curl_close($ch2);

            if ($res2) {
                $extractData = json_decode($res2, true);
                if (!empty($extractData['query']['pages'])) {
                    $pages = $extractData['query']['pages'];
                    $firstPage = reset($pages);
                    if (!empty($firstPage['extract'])) {
                        $prompt .= "\n\n[WIKIPEDIA CONTEXT FOUND FOR ENRICHMENT]: " . $firstPage['extract'] . "\n\n(Use the above Wikipedia context as historical background to formulate your absolute perfect answer.)";
                    }
                }
            }
        }
    }
}

// --- MODEL FAILOVER LIST ---
$models = [
    ['provider' => 'groq', 'name' => 'llama-3.3-70b-versatile'],
    ['provider' => 'google', 'name' => 'gemini-2.0-flash'],
    ['provider' => 'google', 'name' => 'gemini-1.5-flash'],
    ['provider' => 'openrouter', 'name' => 'google/gemini-1.5-flash:free'],
    ['provider' => 'openrouter', 'name' => 'meta-llama/llama-3.1-8b-instruct:free'],
    ['provider' => 'openrouter', 'name' => 'mistralai/mistral-7b-instruct:free'],
    ['provider' => 'huggingface', 'name' => 'Qwen/Qwen2.5-Coder-32B-Instruct'],
];

$lastError = "";

foreach ($models as $model) {
    if ($model['provider'] === 'groq' && empty($GROQ_KEYS)) continue;
    if ($model['provider'] === 'google' && empty($GEMINI_KEYS)) continue;
    if ($model['provider'] === 'openrouter' && empty($OPENROUTER_API_KEY)) continue;
    if ($model['provider'] === 'huggingface' && empty($HUGGINGFACE_API_KEY)) continue;

    $retries = 3;
    for ($i = 0; $i < $retries; $i++) {
        try {
            if ($model['provider'] === 'google') {
                $key = $GEMINI_KEYS[array_rand($GEMINI_KEYS)];
                $result = callGoogleAI($model['name'], $prompt, $systemInstruction, $imageData, $mimeType, $key);
            } elseif ($model['provider'] === 'groq') {
                $key = $GROQ_KEYS[array_rand($GROQ_KEYS)];
                $result = callGroq($model['name'], $prompt, $systemInstruction, $imageData, $mimeType, $key);
            } elseif ($model['provider'] === 'huggingface') {
                $result = callHuggingFace($model['name'], $prompt, $systemInstruction, $imageData, $mimeType, $HUGGINGFACE_API_KEY);
            } else {
                $result = callOpenRouter($model['name'], $prompt, $systemInstruction, $imageData, $mimeType, $OPENROUTER_API_KEY);
            }

            if ($result) {
                // Deduct 1 credit
                $stmt = $pdo->prepare("UPDATE users SET credits = credits - 1 WHERE id = :id");
                $stmt->execute(['id' => $user_id]);

                echo json_encode([
                    "status" => "success",
                    "text" => $result,
                    "model" => $model['name'],
                    "provider" => $model['provider']
                ]);
                exit;
            }
        } catch (Exception $e) {
            $lastError = $model['name'] . ': ' . $e->getMessage();
            if ($model['provider'] === 'huggingface' || $model['provider'] === 'openrouter') {
                break;
            }
            continue;
        }
    }
}

http_response_code(503);
echo json_encode(["status" => "error", "message" => "Server is busy please try again"]);

// --- HELPER FUNCTIONS ---
function callGroq($model, $prompt, $system, $image, $mime, $key) {
    $url = "https://api.groq.com/openai/v1/chat/completions";
    $system = $system . "\n\nCRITICAL INSTRUCTION: You MUST provide an extremely detailed, logically structured, and perfect answer.";

    $content = [["type" => "text", "text" => $prompt]];
    if ($image) {
        $content[] = [
            "type" => "image_url",
            "image_url" => ["url" => "data:{$mime};base64,{$image}"]
        ];
        if (strpos(strtolower($model), "vision") === false && strpos(strtolower($model), "llava") === false) {
            $model = "llama-3.2-11b-vision-preview";
        }
    }

    $messages = [
        ["role" => "system", "content" => $system],
        ["role" => "user", "content" => $content]
    ];

    $data = [
        "model" => $model,
        "messages" => $messages,
        "max_tokens" => 4096
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        throw new Exception("Groq Error ($httpCode)");
    }

    $res = json_decode($response, true);
    return $res['choices'][0]['message']['content'] ?? null;
}

function callGoogleAI($model, $prompt, $system, $image, $mime, $key) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";

    $parts = [["text" => $prompt]];
    if ($image) {
        $parts[] = [
            "inlineData" => [
                "mimeType" => $mime,
                "data" => $image
            ]
        ];
    }

    $data = [
        "contents" => [["parts" => $parts]],
        "systemInstruction" => ["parts" => [["text" => $system]]]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        throw new Exception("Google AI Error ($httpCode)");
    }

    $res = json_decode($response, true);
    return $res['candidates'][0]['content']['parts'][0]['text'] ?? null;
}

function callOpenRouter($model, $prompt, $system, $image, $mime, $key) {
    $url = "https://openrouter.ai/api/v1/chat/completions";
    $content = [["type" => "text", "text" => $prompt]];
    if ($image) {
        $content[] = [
            "type" => "image_url",
            "image_url" => ["url" => "data:{$mime};base64,{$image}"]
        ];
    }

    $data = [
        "model" => $model,
        "messages" => [
            ["role" => "system", "content" => $system],
            ["role" => "user", "content" => $content]
        ],
        "transforms" => ["fallback"]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key,
        'HTTP-Referer: https://aymaninfotech.com',
        'X-Title: Ayman StudyAI'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        throw new Exception("OpenRouter Error ($httpCode)");
    }

    $res = json_decode($response, true);
    return $res['choices'][0]['message']['content'] ?? null;
}

function callHuggingFace($model, $prompt, $system, $image, $mime, $key) {
    $url = "https://api-inference.huggingface.co/v1/chat/completions";
    $content = [["type" => "text", "text" => $prompt]];
    if ($image) {
        $content[] = [
            "type" => "image_url",
            "image_url" => ["url" => "data:{$mime};base64,{$image}"]
        ];
    }

    $data = [
        "model" => $model,
        "messages" => [
            ["role" => "system", "content" => $system],
            ["role" => "user", "content" => $content]
        ],
        "max_tokens" => 4096
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        throw new Exception("Hugging Face Error ($httpCode)");
    }

    $res = json_decode($response, true);
    return $res['choices'][0]['message']['content'] ?? null;
}
?>
