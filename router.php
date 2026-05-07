<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($uri, '/');

if (strpos($path, 'api/') === 0) {
    $_SERVER['REQUEST_URI'] = '/' . substr($path, 4);
    include __DIR__ . '/api/index.php';
    return;
}

if ($path === '' || $path === 'index.php') {
    include __DIR__ . '/index.php';
    return;
}

if (file_exists(__DIR__ . '/' . $path)) {
    return false;
}

http_response_code(404);
echo "Not Found";
?>
