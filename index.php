<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskFlow - Kanban Board</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="app-container">
        <header class="app-header">
            <div class="header-left">
                <div class="logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    <span>TaskFlow</span>
                </div>
                <div class="board-selector">
                    <select id="boardSelect" class="select">
                        <option value="">Select Board</option>
                    </select>
                </div>
            </div>
            <div class="header-right">
                <button id="addColumnBtn" class="btn btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Column
                </button>
                <button id="addBoardBtn" class="btn btn-outline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Board
                </button>
            </div>
        </header>

        <main class="board-container">
            <div id="columnsContainer" class="columns-container"></div>
        </main>
    </div>

    <div id="taskModal" class="modal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">Add Task</h3>
                <button class="modal-close" id="closeModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <form id="taskForm" class="modal-body">
                <input type="hidden" id="taskId">
                <input type="hidden" id="taskColumnId">
                <div class="form-group">
                    <label for="taskTitle">Title</label>
                    <input type="text" id="taskTitle" class="input" placeholder="Enter task title" required>
                </div>
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea id="taskDescription" class="input textarea" placeholder="Add a description..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="taskPriority">Priority</label>
                        <select id="taskPriority" class="select">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="taskDueDate">Due Date</label>
                        <input type="date" id="taskDueDate" class="input">
                    </div>
                </div>
                <div class="form-group">
                    <label>Labels</label>
                    <div id="labelSelector" class="label-selector"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelTask">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Task</button>
                </div>
            </form>
        </div>
    </div>

    <div id="columnModal" class="modal">
        <div class="modal-overlay"></div>
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3 id="columnModalTitle">Add Column</h3>
                <button class="modal-close" id="closeColumnModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <form id="columnForm" class="modal-body">
                <input type="hidden" id="columnId">
                <div class="form-group">
                    <label for="columnName">Column Name</label>
                    <input type="text" id="columnName" class="input" placeholder="Enter column name" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelColumn">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Column</button>
                </div>
            </form>
        </div>
    </div>

    <div id="boardModal" class="modal">
        <div class="modal-overlay"></div>
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3 id="boardModalTitle">Create Board</h3>
                <button class="modal-close" id="closeBoardModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <form id="boardForm" class="modal-body">
                <input type="hidden" id="boardId">
                <div class="form-group">
                    <label for="boardName">Board Name</label>
                    <input type="text" id="boardName" class="input" placeholder="Enter board name" required>
                </div>
                <div class="form-group">
                    <label for="boardDescription">Description</label>
                    <textarea id="boardDescription" class="input textarea" placeholder="Add a description..."></textarea>
                </div>
                <div class="form-group">
                    <label for="boardColor">Color</label>
                    <div class="color-picker">
                        <input type="color" id="boardColor" value="#6366f1" class="color-input">
                        <div class="color-presets">
                            <button type="button" class="color-preset" data-color="#6366f1" style="background:#6366f1"></button>
                            <button type="button" class="color-preset" data-color="#8b5cf6" style="background:#8b5cf6"></button>
                            <button type="button" class="color-preset" data-color="#ec4899" style="background:#ec4899"></button>
                            <button type="button" class="color-preset" data-color="#ef4444" style="background:#ef4444"></button>
                            <button type="button" class="color-preset" data-color="#f59e0b" style="background:#f59e0b"></button>
                            <button type="button" class="color-preset" data-color="#22c55e" style="background:#22c55e"></button>
                            <button type="button" class="color-preset" data-color="#14b8a6" style="background:#14b8a6"></button>
                            <button type="button" class="color-preset" data-color="#3b82f6" style="background:#3b82f6"></button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelBoard">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Board</button>
                </div>
            </form>
        </div>
    </div>

    <div id="deleteModal" class="modal">
        <div class="modal-overlay"></div>
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3>Confirm Delete</h3>
                <button class="modal-close" id="closeDeleteModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p id="deleteMessage">Are you sure you want to delete this item?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelDelete">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
            </div>
        </div>
    </div>

    <script src="assets/js/app.js"></script>
</body>
</html>
