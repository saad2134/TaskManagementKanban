<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../database/config.php';

$db = Database::getInstance()->getConnection();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($uri, '/'));
$endpoint = isset($segments[count($segments) - 1]) ? $segments[count($segments) - 1] : '';

$method = $_SERVER['REQUEST_METHOD'];

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

try {
    switch ($endpoint) {
        case 'boards':
            handleBoards($db, $method);
            break;
        case 'columns':
            handleColumns($db, $method);
            break;
        case 'tasks':
            handleTasks($db, $method);
            break;
        case 'move-task':
            handleMoveTask($db, $method);
            break;
        case 'copy-board':
            handleCopyBoard($db, $method);
            break;
        default:
            jsonResponse(['error' => 'Endpoint not found'], 404);
    }
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

function handleBoards($db, $method) {
    switch ($method) {
        case 'GET':
            $stmt = $db->query("SELECT * FROM boards ORDER BY position ASC");
            jsonResponse($stmt->fetchAll());
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("INSERT INTO boards (name, description, color, position) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['name'], $data['description'] ?? '', $data['color'] ?? '#6366f1', $data['position'] ?? 0]);
            jsonResponse(['id' => $db->lastInsertId()], 201);
            break;
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("UPDATE boards SET name = ?, description = ?, color = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['description'], $data['color'], $data['id']]);
            jsonResponse(['success' => true]);
            break;
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("DELETE FROM boards WHERE id = ?");
            $stmt->execute([$data['id']]);
            jsonResponse(['success' => true]);
            break;
    }
}

function handleColumns($db, $method) {
    switch ($method) {
        case 'GET':
            $boardId = $_GET['board_id'] ?? null;
            if ($boardId) {
                $stmt = $db->prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC");
                $stmt->execute([$boardId]);
            } else {
                $stmt = $db->query("SELECT * FROM columns ORDER BY position ASC");
            }
            jsonResponse($stmt->fetchAll());
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)");
            $stmt->execute([$data['board_id'], $data['name'], $data['position'] ?? 0]);
            jsonResponse(['id' => $db->lastInsertId()], 201);
            break;
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("UPDATE columns SET name = ?, position = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['position'], $data['id']]);
            jsonResponse(['success' => true]);
            break;
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("DELETE FROM columns WHERE id = ?");
            $stmt->execute([$data['id']]);
            jsonResponse(['success' => true]);
            break;
    }
}

function handleTasks($db, $method) {
    switch ($method) {
        case 'GET':
            $columnId = $_GET['column_id'] ?? null;
            if ($columnId) {
                $stmt = $db->prepare("SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names, GROUP_CONCAT(l.color) as label_colors FROM tasks t LEFT JOIN task_labels tl ON t.id = tl.task_id LEFT JOIN labels l ON tl.label_id = l.id WHERE t.column_id = ? GROUP BY t.id ORDER BY t.position ASC");
                $stmt->execute([$columnId]);
            } else {
                $stmt = $db->query("SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names, GROUP_CONCAT(l.color) as label_colors FROM tasks t LEFT JOIN task_labels tl ON t.id = tl.task_id LEFT JOIN labels l ON tl.label_id = l.id GROUP BY t.id ORDER BY t.position ASC");
            }
            $tasks = $stmt->fetchAll();
            foreach ($tasks as &$task) {
                if ($task['label_ids']) {
                    $task['label_ids'] = explode(',', $task['label_ids']);
                    $task['label_names'] = explode(',', $task['label_names']);
                    $task['label_colors'] = explode(',', $task['label_colors']);
                } else {
                    $task['label_ids'] = [];
                    $task['label_names'] = [];
                    $task['label_colors'] = [];
                }
            }
            jsonResponse($tasks);
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("INSERT INTO tasks (column_id, title, description, priority, due_date, position) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['column_id'], $data['title'], $data['description'] ?? '', $data['priority'] ?? 'medium', $data['due_date'] ?? null, $data['position'] ?? 0]);
            $taskId = $db->lastInsertId();
            
            if (!empty($data['label_ids'])) {
                $insertLabel = $db->prepare("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
                foreach ($data['label_ids'] as $labelId) {
                    $insertLabel->execute([$taskId, $labelId]);
                }
            }
            
            jsonResponse(['id' => $taskId], 201);
            break;
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, position = ? WHERE id = ?");
            $stmt->execute([$data['title'], $data['description'], $data['priority'], $data['due_date'], $data['position'], $data['id']]);
            
            $db->exec("DELETE FROM task_labels WHERE task_id = " . $data['id']);
            if (!empty($data['label_ids'])) {
                $insertLabel = $db->prepare("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
                foreach ($data['label_ids'] as $labelId) {
                    $insertLabel->execute([$data['id'], $labelId]);
                }
            }
            
            jsonResponse(['success' => true]);
            break;
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$data['id']]);
            jsonResponse(['success' => true]);
            break;
    }
}

function handleMoveTask($db, $method) {
    if ($method !== 'POST') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("UPDATE tasks SET column_id = ?, position = ? WHERE id = ?");
    $stmt->execute([$data['column_id'], $data['position'], $data['task_id']]);
    
    jsonResponse(['success' => true]);
}

function handleCopyBoard($db, $method) {
    if ($method !== 'POST') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $boardId = $data['board_id'];
    
    $stmt = $db->prepare("SELECT * FROM boards WHERE id = ?");
    $stmt->execute([$boardId]);
    $board = $stmt->fetch();
    if (!$board) {
        jsonResponse(['error' => 'Board not found'], 404);
    }
    
    $stmt = $db->prepare("INSERT INTO boards (name, description, color, position) VALUES (?, ?, ?, ?)");
    $stmt->execute([$board['name'] . ' (Copy)', $board['description'], $board['color'], $board['position']]);
    $newBoardId = $db->lastInsertId();
    
    $stmt = $db->prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC");
    $stmt->execute([$boardId]);
    $columns = $stmt->fetchAll();
    
    $colIdMap = [];
    foreach ($columns as $col) {
        $stmt = $db->prepare("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)");
        $stmt->execute([$newBoardId, $col['name'], $col['position']]);
        $colIdMap[$col['id']] = $db->lastInsertId();
    }
    
    foreach ($columns as $col) {
        $stmt = $db->prepare("SELECT * FROM tasks WHERE column_id = ? ORDER BY position ASC");
        $stmt->execute([$col['id']]);
        $tasks = $stmt->fetchAll();
        foreach ($tasks as $task) {
            $stmt = $db->prepare("INSERT INTO tasks (column_id, title, description, priority, due_date, position) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$colIdMap[$col['id']], $task['title'], $task['description'], $task['priority'], $task['due_date'], $task['position']]);
            $newTaskId = $db->lastInsertId();
            
            $stmt2 = $db->prepare("SELECT label_id FROM task_labels WHERE task_id = ?");
            $stmt2->execute([$task['id']]);
            $labelIds = $stmt2->fetchAll(PDO::FETCH_COLUMN);
            foreach ($labelIds as $labelId) {
                $stmt3 = $db->prepare("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
                $stmt3->execute([$newTaskId, $labelId]);
            }
        }
    }
    
    jsonResponse(['id' => $newBoardId], 201);
}
?>
