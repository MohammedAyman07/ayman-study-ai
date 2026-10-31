<?php
/**
 * AYMAN STUDY AI - Database Connection
 * Configured securely via Environment Variables
 */

$DB_HOST = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost');
$DB_USER = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
$DB_PASS = getenv('DB_PASS') ?: ($_ENV['DB_PASS'] ?? '');
$DB_NAME = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'aymanstudyai');

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(["status" => "error", "message" => "Database Connection Failed"]));
}
?>
