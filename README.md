# TaskFlow - Kanban Board Application

A modern, professional task management application inspired by Trello and built with a shadcn-style UI. Features full drag-and-drop functionality, multiple boards, columns, and task cards with priority levels, labels, and due dates.

## Features

- **Multi-Board Support** - Create and manage multiple project boards with custom colors
- **Drag & Drop** - Smooth, intuitive drag-and-drop for task cards between columns
- **Columns** - Customizable columns (To Do, In Progress, Review, Done, etc.)
- **Task Cards** - Rich task cards with:
  - Title and description
  - Priority levels (Low, Medium, High)
  - Due dates with overdue indicators
  - Color-coded labels (Bug, Feature, Enhancement, Documentation)
- **CRUD Operations** - Full create, read, update, delete for boards, columns, and tasks
- **Modern UI** - shadcn-inspired design with:
  - Clean, professional aesthetic
  - Smooth animations and transitions
  - Toast notifications
  - Responsive design

## Technology Stack

- **Frontend**: HTML5, CSS3 (Custom CSS with shadcn-inspired design), Vanilla JavaScript (ES6+)
- **Backend**: PHP 7.4+ (REST API)
- **Database**: MySQL 5.7+ with PDO
- **Server**: PHP Built-in Server or Apache

## Project Structure

```
TaskManagementKanban/
├── api/
│   └── index.php          # REST API endpoints
├── assets/
│   ├── css/
│   │   └── style.css      # shadcn-inspired styles
│   └── js/
│       └── app.js         # Application logic & drag-drop
├── database/
│   ├── config.php         # Database configuration
│   └── schema.sql         # Database schema
├── .htaccess             # Apache URL rewriting rules
├── router.php            # PHP built-in server router
├── index.php             # Main application entry point
└── README.md             # This file
```

## Installation

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- A web browser

### Quick Start with PHP Built-in Server

1. **Navigate to project directory**:
   ```bash
   cd C:\Users\UwU\Desktop\TaskManagementKanban
   ```

2. **Start PHP server** with router:
   ```bash
   php -S localhost:8000 router.php
   ```

3. **Create the database** (in another terminal):
   ```bash
   mysql -u root -p
   ```
   Then run:
   ```sql
   SOURCE database/schema.sql;
   ```

4. **Access**: Open `http://localhost:8000` in your browser

### Setup Steps

1. **Clone or download the project** to your web server's document root:
   ```
   /var/www/html/taskflow/
   or
   C:\xampp\htdocs\taskflow\
   ```

2. **Create the database**:
   - Open phpMyAdmin or MySQL CLI
   - Create a new database named `task_kanban`
   - Import the schema file:
   ```bash
   mysql -u root -p task_kanban < database/schema.sql
   ```
   Or via phpMyAdmin:
   - Select the database
   - Go to Import tab
   - Choose `database/schema.sql`
   - Click Go

3. **Configure database connection**:
   - Edit `database/config.php` with your MySQL credentials:
   ```php
   private $host = 'localhost';
   private $dbname = 'task_kanban';
   private $username = 'root';      // Your MySQL username
   private $password = '';          // Your MySQL password
   ```

4. **Start the server**:
   - For XAMPP: Start Apache and MySQL services
   - For WAMP: Start Apache and MySQL services
   - For Linux: `sudo systemctl start apache2 mysql`
   - **OR use PHP built-in server**: `php -S localhost:8000 router.php`

5. **Access the application**:
   - Open your browser and navigate to: `http://localhost/taskflow/`
   - Or directly: `http://localhost/taskflow/index.php`

## Usage Guide

### Managing Boards

- **Select Board**: Use the dropdown in the header to switch between boards
- **Create Board**: Click "New Board" button to create a new project board
- **Edit Board**: Select a board, then modify via the board modal
- **Custom Colors**: Choose from 8 preset colors or use a custom color picker

### Managing Columns

- **Add Column**: Click "Add Column" button in the header
- **Edit Column**: Click the edit icon on any column header
- **Delete Column**: Click the delete icon (deletes all tasks in column)

### Managing Tasks

- **Add Task**: Click "Add Task" button at the bottom of any column
- **Edit Task**: Click on any task card or the edit icon
- **Delete Task**: Click the delete icon on a task card
- **Move Task**: Drag and drop tasks between columns or reorder within a column

### Task Properties

- **Title**: Required - the task name
- **Description**: Optional - detailed task description
- **Priority**: Low (green), Medium (yellow), High (red)
- **Due Date**: Optional - shows overdue indicator if past due
- **Labels**: Optional - color-coded labels (Bug, Feature, Enhancement, Documentation)

## API Documentation

The REST API provides the following endpoints:

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | Get all boards |
| POST | `/api/boards` | Create a new board |
| PUT | `/api/boards` | Update a board |
| DELETE | `/api/boards` | Delete a board |

### Columns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/columns?board_id={id}` | Get columns for a board |
| POST | `/api/columns` | Create a new column |
| PUT | `/api/columns` | Update a column |
| DELETE | `/api/columns` | Delete a column |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?column_id={id}` | Get tasks for a column |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks` | Update a task |
| DELETE | `/api/tasks` | Delete a task |

### Task Movement

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/move-task` | Move a task to a different column/position |

## Database Schema

The application uses 5 tables:

- **boards** - Stores project boards
- **columns** - Stores columns (lists) belonging to boards
- **tasks** - Stores task cards belonging to columns
- **labels** - Stores reusable labels
- **task_labels** - Many-to-many relationship between tasks and labels

## Configuration Options

### Database (database/config.php)

```php
private $host = 'localhost';      // Database host
private $dbname = 'task_kanban'; // Database name
private $username = 'root';      // Database username
private $password = '';          // Database password
```

### API Base URL (assets/js/app.js)

```javascript
const API_BASE = 'api/index.php';
```

Update this if your API path is different.

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Considerations

- Tasks are loaded per-column on demand
- Drag-and-drop operations update in real-time
- Smooth 60fps animations
- CSS-based transitions for minimal JS overhead

## Security Notes

- Input data is sanitized via prepared statements (PDO)
- HTML output is escaped to prevent XSS
- CORS headers allow cross-origin requests (configure for production)

## Troubleshooting

### Database Connection Failed
- Verify MySQL is running
- Check credentials in `database/config.php`
- Ensure the database exists

### Alternative: Use SQLite (No MySQL Required!)
If you don't have MySQL, you can use SQLite. Replace `database/config.php` with:

```php
<?php
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dbPath = __DIR__ . '/kanban.sqlite';
            $this->connection = new PDO("sqlite:$dbPath");
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->initSQLite();
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    
    private function initSQLite() {
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS boards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT DEFAULT '#6366f1',
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS columns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                column_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                priority TEXT DEFAULT 'medium',
                due_date DATE,
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
            );
        ");
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
}
?>
```

### API Requests Returning 404
- For PHP built-in server: Use `php -S localhost:8000 router.php` (not just `php -S localhost:8000`)
- For Apache: Verify `.htaccess` is in the root directory

### Drag and Drop Not Working
- Ensure no JavaScript errors in console
- Verify browser supports HTML5 Drag and Drop API
- Check that the API is responding correctly

### Styles Not Loading
- Verify the CSS file path in `index.php`
- Check browser console for 404 errors
- Ensure the assets folder is accessible

## License

This project is open source and available for educational and personal use.

## Credits

- UI Design inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide Icons](https://lucide.dev/)
- Font from [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
