const API_BASE = 'api/index.php';
let currentBoard = null;
let columns = [];
let tasks = {};
let draggedTask = null;
let dragPreview = null;
let deleteCallback = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    await loadBoards();
}

function setupEventListeners() {
    document.getElementById('boardSelect').addEventListener('change', handleBoardChange);
    document.getElementById('addColumnBtn').addEventListener('click', () => openColumnModal());
    document.getElementById('addBoardBtn').addEventListener('click', () => openBoardModal());
    
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('closeColumnModal').addEventListener('click', closeColumnModal);
    document.getElementById('closeBoardModal').addEventListener('click', closeBoardModal);
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', closeAllModals);
    });
    
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('columnForm').addEventListener('submit', handleColumnSubmit);
    document.getElementById('boardForm').addEventListener('submit', handleBoardSubmit);
    
    document.getElementById('cancelTask').addEventListener('click', closeModal);
    document.getElementById('cancelColumn').addEventListener('click', closeColumnModal);
    document.getElementById('cancelBoard').addEventListener('click', closeBoardModal);
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
    
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', handleColorPreset);
    });
}

async function loadBoards() {
    try {
        const res = await fetch(`${API_BASE}/boards`);
        const boards = await res.json();
        const select = document.getElementById('boardSelect');
        select.innerHTML = '<option value="">Select Board</option>';
        boards.forEach(board => {
            const opt = document.createElement('option');
            opt.value = board.id;
            opt.textContent = board.name;
            opt.dataset.color = board.color;
            select.appendChild(opt);
        });
        if (boards.length > 0) {
            select.value = boards[0].id;
            await loadBoard(boards[0].id);
        }
    } catch (err) {
        showToast('Failed to load boards', 'error');
    }
}

async function handleBoardChange(e) {
    const boardId = e.target.value;
    if (boardId) await loadBoard(boardId);
}

async function loadBoard(boardId) {
    currentBoard = boardId;
    try {
        const [columnsRes, labelsRes] = await Promise.all([
            fetch(`${API_BASE}/columns?board_id=${boardId}`),
            fetch(`${API_BASE}/boards`)
        ]);
        columns = await columnsRes.json();
        
        const taskPromises = columns.map(col => 
            fetch(`${API_BASE}/tasks?column_id=${col.id}`).then(r => r.json())
        );
        const taskResults = await Promise.all(taskPromises);
        tasks = {};
        columns.forEach((col, i) => tasks[col.id] = taskResults[i]);
        
        renderLabels();
        renderColumns();
    } catch (err) {
        showToast('Failed to load board', 'error');
    }
}

async function loadLabels() {
    try {
        const res = await fetch(`${API_BASE}/boards`);
        return [];
    } catch (err) {
        return [];
    }
}

function renderLabels() {}

function renderColumns() {
    const container = document.getElementById('columnsContainer');
    container.innerHTML = '';
    
    columns.forEach(col => {
        const colEl = createColumnElement(col);
        container.appendChild(colEl);
    });
}

function createColumnElement(col) {
    const column = document.createElement('div');
    column.className = 'column';
    column.dataset.columnId = col.id;
    
    const colTasks = tasks[col.id] || [];
    
    column.innerHTML = `
        <div class="column-header">
            <div class="column-title">
                <span>${col.name}</span>
                <span class="column-count">${colTasks.length}</span>
            </div>
            <div class="column-actions">
                <button class="btn btn-icon btn-ghost" onclick="editColumn(${col.id})" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn btn-icon btn-ghost" onclick="deleteColumn(${col.id})" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="column-body">
            <div class="tasks-list" data-column-id="${col.id}"></div>
        </div>
        <div class="column-footer">
            <button class="add-task-btn" onclick="openTaskModal(${col.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Task
            </button>
        </div>
    `;
    
    const tasksList = column.querySelector('.tasks-list');
    tasksList.addEventListener('dragover', handleDragOver);
    tasksList.addEventListener('dragenter', handleDragEnter);
    tasksList.addEventListener('dragleave', handleDragLeave);
    tasksList.addEventListener('drop', handleDrop);
    
    (tasks[col.id] || []).forEach(task => {
        tasksList.appendChild(createTaskCard(task));
    });
    
    return column;
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.columnId = task.column_id;
    
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    const labels = [];
    if (task.label_ids && task.label_ids.length > 0) {
        task.label_ids.forEach((id, i) => {
            if (task.label_names && task.label_names[i]) {
                labels.push({
                    name: task.label_names[i],
                    color: task.label_colors ? task.label_colors[i] : '#6366f1'
                });
            }
        });
    }
    
    let labelsHtml = '';
    if (labels.length > 0) {
        labelsHtml = `<div class="task-labels">${labels.map(l => 
            `<span class="task-label" style="background:${l.color}">${l.name}</span>`
        ).join('')}</div>`;
    }
    
    const priorityClass = `priority-${task.priority}`;
    const dueDateClass = task.due_date ? (new Date(task.due_date) < new Date() ? 'overdue' : '') : '';
    const formattedDate = task.due_date ? formatDate(task.due_date) : '';
    
    card.innerHTML = `
        ${labelsHtml}
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
            <span class="task-priority ${priorityClass}">
                <span class="priority-dot"></span>
                ${task.priority}
            </span>
            ${formattedDate ? `
                <span class="task-due-date ${dueDateClass}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    ${formattedDate}
                </span>
            ` : ''}
        </div>
        <div class="task-actions">
            <button class="btn btn-icon btn-ghost btn-sm" onclick="editTask(${task.id})" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
            <button class="btn btn-icon btn-ghost btn-sm" onclick="deleteTask(${task.id})" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            editTask(task.id);
        }
    });
    
    return card;
}

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    
    dragPreview = e.target.cloneNode(true);
    dragPreview.className = 'task-card drag-preview';
    dragPreview.style.width = e.target.offsetWidth + 'px';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 20, 20);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    if (dragPreview) {
        dragPreview.remove();
        dragPreview = null;
    }
    draggedTask = null;
    document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
    document.querySelectorAll('.drop-indicator').forEach(i => i.remove());
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const tasksList = e.currentTarget;
    const cards = [...tasksList.querySelectorAll('.task-card:not(.dragging)')];
    const mouseY = e.clientY;
    
    let closestCard = null;
    let closestOffset = Number.NEGATIVE_INFINITY;
    
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const offset = mouseY - rect.top - rect.height / 2;
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closestCard = card;
        }
    });
    
    document.querySelectorAll('.drop-indicator').forEach(i => i.remove());
    
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator active';
    
    if (closestCard) {
        tasksList.insertBefore(indicator, closestCard);
    } else {
        tasksList.appendChild(indicator);
    }
}

function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.closest('.column')?.classList.add('drag-over');
}

function handleDragLeave(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
        e.currentTarget.closest('.column')?.classList.remove('drag-over');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
    document.querySelectorAll('.drop-indicator').forEach(i => i.remove());
    
    const taskId = e.dataTransfer.getData('text/plain');
    const tasksList = e.currentTarget;
    const newColumnId = parseInt(tasksList.dataset.columnId);
    
    const cards = [...tasksList.querySelectorAll('.task-card:not(.dragging)')];
    let newPosition = 0;
    
    const mouseY = e.clientY;
    let insertedBefore = null;
    
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (mouseY < rect.top + rect.height / 2) {
            if (!insertedBefore || rect.top < insertedBefore.getBoundingClientRect().top) {
                insertedBefore = card;
            }
        }
    });
    
    cards.forEach((card, i) => {
        if (card.dataset.taskId !== taskId) {
            if (card === insertedBefore) {
                // position counted
            } else {
                newPosition++;
            }
        }
    });
    
    if (insertedBefore) newPosition++;
    
    try {
        await fetch(`${API_BASE}/move-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, column_id: newColumnId, position: newPosition })
        });
        
        const oldColumnId = parseInt(draggedTask.dataset.columnId);
        tasks[oldColumnId] = tasks[oldColumnId].filter(t => t.id != taskId);
        const task = tasks[oldColumnId]?.find(t => t.id == taskId);
        if (task) {
            task.column_id = newColumnId;
            task.position = newPosition;
            if (!tasks[newColumnId]) tasks[newColumnId] = [];
            tasks[newColumnId].push(task);
            tasks[newColumnId].sort((a, b) => a.position - b.position);
        }
        
        await loadBoard(currentBoard);
        showToast('Task moved successfully', 'success');
    } catch (err) {
        showToast('Failed to move task', 'error');
    }
}

function openTaskModal(columnId, task = null) {
    document.getElementById('taskColumnId').value = columnId;
    document.getElementById('taskId').value = task ? task.id : '';
    document.getElementById('taskTitle').value = task ? task.title : '';
    document.getElementById('taskDescription').value = task ? task.description : '';
    document.getElementById('taskPriority').value = task ? task.priority : 'medium';
    document.getElementById('taskDueDate').value = task ? task.due_date : '';
    document.getElementById('modalTitle').textContent = task ? 'Edit Task' : 'Add Task';
    
    const labelSelector = document.getElementById('labelSelector');
    labelSelector.innerHTML = '';
    
    const sampleLabels = [
        { id: 1, name: 'Bug', color: '#ef4444' },
        { id: 2, name: 'Feature', color: '#22c55e' },
        { id: 3, name: 'Enhancement', color: '#3b82f6' },
        { id: 4, name: 'Documentation', color: '#f59e0b' }
    ];
    
    sampleLabels.forEach(label => {
        const isChecked = task?.label_ids?.includes(label.id.toString());
        labelSelector.innerHTML += `
            <input type="checkbox" class="label-checkbox" id="label-${label.id}" value="${label.id}" ${isChecked ? 'checked' : ''}>
            <label for="label-${label.id}" style="background:${label.color}">${label.name}</label>
        `;
    });
    
    document.getElementById('taskModal').classList.add('active');
}

async function editTask(taskId) {
    for (const colId in tasks) {
        const task = tasks[colId].find(t => t.id == taskId);
        if (task) {
            openTaskModal(colId, task);
            break;
        }
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('taskId').value;
    const columnId = document.getElementById('taskColumnId').value;
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    const labelIds = [...document.querySelectorAll('#labelSelector input:checked')].map(i => i.value);
    
    const taskData = { column_id: columnId, title, description, priority, due_date: dueDate, label_ids: labelIds };
    
    try {
        if (taskId) {
            taskData.id = taskId;
            taskData.position = 0;
            await fetch(`${API_BASE}/tasks`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            showToast('Task updated successfully', 'success');
        } else {
            await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            showToast('Task created successfully', 'success');
        }
        
        closeModal();
        await loadBoard(currentBoard);
    } catch (err) {
        showToast('Failed to save task', 'error');
    }
}

function deleteTask(taskId) {
    deleteCallback = async () => {
        try {
            await fetch(`${API_BASE}/tasks`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId })
            });
            showToast('Task deleted successfully', 'success');
            await loadBoard(currentBoard);
        } catch (err) {
            showToast('Failed to delete task', 'error');
        }
    };
    document.getElementById('deleteMessage').textContent = 'Are you sure you want to delete this task?';
    document.getElementById('deleteModal').classList.add('active');
}

function openColumnModal(column = null) {
    document.getElementById('columnId').value = column ? column.id : '';
    document.getElementById('columnName').value = column ? column.name : '';
    document.getElementById('columnModalTitle').textContent = column ? 'Edit Column' : 'Add Column';
    document.getElementById('columnModal').classList.add('active');
}

function editColumn(colId) {
    const col = columns.find(c => c.id === colId);
    if (col) openColumnModal(col);
}

async function handleColumnSubmit(e) {
    e.preventDefault();
    
    const columnId = document.getElementById('columnId').value;
    const name = document.getElementById('columnName').value;
    
    try {
        if (columnId) {
            await fetch(`${API_BASE}/columns`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: columnId, name, position: 0 })
            });
            showToast('Column updated successfully', 'success');
        } else {
            await fetch(`${API_BASE}/columns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ board_id: currentBoard, name, position: columns.length })
            });
            showToast('Column created successfully', 'success');
        }
        
        closeColumnModal();
        await loadBoard(currentBoard);
    } catch (err) {
        showToast('Failed to save column', 'error');
    }
}

function deleteColumn(colId) {
    deleteCallback = async () => {
        try {
            await fetch(`${API_BASE}/columns`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: colId })
            });
            showToast('Column deleted successfully', 'success');
            await loadBoard(currentBoard);
        } catch (err) {
            showToast('Failed to delete column', 'error');
        }
    };
    document.getElementById('deleteMessage').textContent = 'Are you sure you want to delete this column and all its tasks?';
    document.getElementById('deleteModal').classList.add('active');
}

function openBoardModal(board = null) {
    document.getElementById('boardId').value = board ? board.id : '';
    document.getElementById('boardName').value = board ? board.name : '';
    document.getElementById('boardDescription').value = board ? board.description : '';
    document.getElementById('boardColor').value = board ? board.color : '#6366f1';
    document.getElementById('boardModalTitle').textContent = board ? 'Edit Board' : 'Create Board';
    updateColorPresets();
    document.getElementById('boardModal').classList.add('active');
}

function handleColorPreset(e) {
    const color = e.currentTarget.dataset.color;
    document.getElementById('boardColor').value = color;
    updateColorPresets();
}

function updateColorPresets() {
    const current = document.getElementById('boardColor').value;
    document.querySelectorAll('.color-preset').forEach(p => {
        p.classList.toggle('active', p.dataset.color === current);
    });
}

async function handleBoardSubmit(e) {
    e.preventDefault();
    
    const boardId = document.getElementById('boardId').value;
    const name = document.getElementById('boardName').value;
    const description = document.getElementById('boardDescription').value;
    const color = document.getElementById('boardColor').value;
    
    try {
        if (boardId) {
            await fetch(`${API_BASE}/boards`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: boardId, name, description, color })
            });
            showToast('Board updated successfully', 'success');
        } else {
            await fetch(`${API_BASE}/boards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, color })
            });
            showToast('Board created successfully', 'success');
        }
        
        closeBoardModal();
        await loadBoards();
    } catch (err) {
        showToast('Failed to save board', 'error');
    }
}

async function confirmDelete() {
    if (deleteCallback) {
        await deleteCallback();
        deleteCallback = null;
    }
    closeDeleteModal();
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function closeColumnModal() {
    document.getElementById('columnModal').classList.remove('active');
}

function closeBoardModal() {
    document.getElementById('boardModal').classList.remove('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
}

function closeAllModals() {
    closeModal();
    closeColumnModal();
    closeBoardModal();
    closeDeleteModal();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const container = document.createElement('div');
    container.className = 'toast-container';
    if (!document.querySelector('.toast-container')) {
        document.body.appendChild(container);
    } else {
        container = document.querySelector('.toast-container');
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${type === 'success' ? '#22c55e' : '#ef4444'}" stroke-width="2">
            ${type === 'success' 
                ? '<polyline points="20 6 9 17 4 12"/>' 
                : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'}
        </svg>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
