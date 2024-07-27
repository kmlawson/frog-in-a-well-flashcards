<?php
// Start output buffering
ob_start();

// Error reporting for debugging (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuration
$SCORES_DIR = 'scores';
$CARDS_DIR = 'cards';  // Directory where card files are stored
$MAX_SCORES = 10;
$RATE_LIMIT_SECONDS = 30;

// Offensive word filter
$offensiveWordFilters = [
    '/fuck/i' => 'FudgeFred',
    '/shit/i' => 'SillySam',
    '/ass/i' => 'AwfulAndy',
    '/bitch/i' => 'BashfulBary',
    '/pussy/i' => 'PlayfulPenny'
    // Add more filters here as needed
];

function filterOffensiveWords($text, $filters) {
    return preg_replace(array_keys($filters), array_values($filters), $text);
}

// Set SameSite attribute for session cookie
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax'
]);

// Function to send JSON response
function sendResponse($success, $message, $debug = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($debug !== null) {
        $response['debug'] = $debug;
    }
    // Capture any output that occurred before this point
    $response['unexpected_output'] = ob_get_clean();
    
    // Ensure only JSON is output
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Function to get allowed card files
function getAllowedCardFiles($directory) {
    $allowedFiles = [];
    if (is_dir($directory)) {
        $files = scandir($directory);
        foreach ($files as $file) {
            if (is_file("$directory/$file") && pathinfo($file, PATHINFO_EXTENSION) === 'txt') {
                $allowedFiles[] = $file;
            }
        }
    }
    return $allowedFiles;
}


// Receive and decode JSON data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Debug: Log received data
error_log("Received data: " . print_r($data, true));

// Input validation
if (!isset($data['name']) || !isset($data['time']) || !isset($data['date']) || !isset($data['cardFile']) ||
    !is_string($data['name']) || !is_numeric($data['time']) || !is_string($data['date']) || !is_string($data['cardFile'])) {
    sendResponse(false, 'Invalid data', ['received' => $data]);
}

// Sanitize inputs
$name = filterOffensiveWords(htmlspecialchars($data['name'], ENT_QUOTES, 'UTF-8'), $offensiveWordFilters);
$time = filter_var($data['time'], FILTER_VALIDATE_INT);
$date = htmlspecialchars($data['date'], ENT_QUOTES, 'UTF-8');
$cardFile = pathinfo(htmlspecialchars($data['cardFile'], ENT_QUOTES, 'UTF-8'), PATHINFO_FILENAME);

// Additional validation
if (empty($name) || $time === false || empty($date) || empty($cardFile)) {
    sendResponse(false, 'Invalid data after sanitization', ['name' => $name, 'time' => $time, 'date' => $date, 'cardFile' => $cardFile]);
}

// Get the list of allowed card files
$allowedCardFiles = array_map(function($file) {
    return pathinfo($file, PATHINFO_FILENAME);
}, glob($CARDS_DIR . '/*.txt'));

// Check if the submitted card file is in the allowed list
if (!in_array($cardFile, $allowedCardFiles)) {
    sendResponse(false, 'Invalid card file', ['cardFile' => $cardFile, 'allowed' => $allowedCardFiles]);
}

// Ensure scores directory exists
if (!file_exists($SCORES_DIR) && !mkdir($SCORES_DIR, 0755, true)) {
    error_log("Failed to create scores directory");
    sendResponse(false, 'Server error - failed to create directory', ['dir' => $SCORES_DIR]);
}

// Implement rate limiting
session_start();
if (isset($_SESSION['last_score_time']) && time() - $_SESSION['last_score_time'] < $RATE_LIMIT_SECONDS) {
    sendResponse(false, 'Please wait before submitting another score', ['lastSubmit' => $_SESSION['last_score_time'], 'now' => time()]);
}
$_SESSION['last_score_time'] = time();

// Function to write scores
function writeScores($scoreFile, $scores) {
    $tmpFile = tempnam(sys_get_temp_dir(), 'score_');
    if ($tmpFile === false) {
        error_log("Failed to create temporary file");
        return false;
    }
    
    $success = false;
    if ($file = fopen($tmpFile, 'w')) {
        foreach ($scores as $score) {
            if (fwrite($file, $score['name'] . "\t" . $score['time'] . "\t" . $score['date'] . "\n") === false) {
                error_log("Failed to write to temporary file");
                break;
            }
        }
        if (fclose($file) && rename($tmpFile, $scoreFile)) {
            // Set file permissions to be readable by anyone
            chmod($scoreFile, 0644);
            $success = true;
        } else {
            error_log("Failed to close temporary file or rename it");
        }
    } else {
        error_log("Failed to open temporary file for writing");
    }
    
    if (!$success) {
        unlink($tmpFile);
    }
    return $success;
}

// Save the score
$scoreFile = $SCORES_DIR . '/' . pathinfo($cardFile, PATHINFO_FILENAME) . '_scores.txt';
$scores = file_exists($scoreFile) ? array_map(function($line) {
    list($name, $time, $date) = explode("\t", trim($line));
    return ['name' => $name, 'time' => (int)$time, 'date' => $date];
}, file($scoreFile)) : [];

$scores[] = ['name' => $name, 'time' => $time, 'date' => $date];
usort($scores, function($a, $b) { return $a['time'] - $b['time']; });
$scores = array_slice($scores, 0, $MAX_SCORES); // Keep only top scores

if (writeScores($scoreFile, $scores)) {
    // Ensure the scores directory is readable
    chmod($SCORES_DIR, 0755);
    sendResponse(true, 'Score saved successfully');
} else {
    sendResponse(false, 'Failed to save score', ['scoreFile' => $scoreFile, 'scores' => $scores]);
}