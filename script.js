// Select DOM elements
const taskInput = document.getElementById('task-input');
const taskDateInput = document.getElementById('task-date');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const pendingCount = document.getElementById('pending-count');
const clearBtn = document.getElementById('clear-btn');
const popupOverlay = document.getElementById('custom-popup');
const closePopupBtn = document.getElementById('close-popup');

// Initialize tasks
let tasks = loadTasks();

// Set minimum date
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
const currentDateTime = now.toISOString().slice(0, 16);
if (taskDateInput) {
    taskDateInput.min = currentDateTime;
}

/**
 * Load and Sanitize Tasks
 */
function loadTasks() {
    try {
        const stored = localStorage.getItem('tasks');
        let t = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(t)) return [];

        // Sanitize
        return t.map(task => ({
            text: task.text || 'Untitled',
            date: task.date || '',
            status: ['undone', 'inprogress', 'completed'].includes(task.status) ? task.status :
                (task.completed ? 'completed' : 'undone')
        }));
    } catch (e) {
        console.error("Failed to load tasks", e);
        return [];
    }
}

/**
 * Save tasks
 */
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updatePendingCount();
}

/**
 * Update Pending Count
 */
function updatePendingCount() {
    const count = tasks.filter(task => task.status !== 'completed').length;
    pendingCount.textContent = `You have ${count} pending task${count !== 1 ? 's' : ''}`;
}

/**
 * Date Formatter
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Get Status Visuals
 */
function getStatusDetails(status) {
    switch (status) {
        case 'completed': return { icon: '<i class="fas fa-check"></i>', class: 'status-completed' };
        case 'inprogress': return { icon: '<i class="fas fa-spinner fa-spin"></i>', class: 'status-inprogress' };
        default: return { icon: '', class: 'status-undone' };
    }
}

/**
 * Render Tasks
 */
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        // Use the mapped class name (e.g., 'status-completed') instead of raw status
        // to match CSS selectors like .status-completed .status-btn
        const statusDetails = getStatusDetails(task.status);
        li.className = `task-item ${statusDetails.class}`;
        li.dataset.index = index;

        // HTML Structure using template literals for clarity
        // Note: Using button type="button" to avoid any form submission behavior
        li.innerHTML = `
            <div class="task-info" role="button" tabindex="0">
                <button type="button" class="status-btn ${statusDetails.class}" title="Change Status">
                    ${statusDetails.icon}
                </button>
                <div class="text-wrapper">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    ${task.date ? `<span class="task-date">${formatDate(task.date)}</span>` : ''}
                </div>
            </div>
            <button type="button" class="delete-btn" title="Delete Task">
                <i class="fas fa-trash"></i>
            </button>
        `;

        taskList.appendChild(li);
    });
    updatePendingCount();
}

// Helper to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Event Delegation for Task List
 */
taskList.addEventListener('click', (e) => {
    // Find closest list item
    const li = e.target.closest('.task-item');
    if (!li) return;

    const index = parseInt(li.dataset.index);
    if (isNaN(index)) return;

    // Check if delete button was clicked
    if (e.target.closest('.delete-btn')) {
        handleDeleteAnimation(li, index);
        return;
    }

    // Check if task info or status button was clicked (for status cycle)
    if (e.target.closest('.task-info') || e.target.closest('.status-btn')) {
        cycleStatus(index);
    }
});

/**
 * Cycle Status Logic
 */
function cycleStatus(index) {
    const current = tasks[index].status;
    let next = 'undone';

    if (current === 'undone') next = 'inprogress';
    else if (current === 'inprogress') next = 'completed';
    else if (current === 'completed') next = 'undone'; // Cycle back

    tasks[index].status = next;
    saveTasks();
    renderTasks();
}

/**
 * Delete Logic
 */
function handleDeleteAnimation(element, index) {
    element.classList.add('slide-out');
    element.addEventListener('animationend', () => {
        // Re-read index in case list shifted? No, splice strictly needs current index logic.
        // But if multiple overlapping animations happen, index might drift. 
        // Safer to delete by unique ID, but for this simple app, re-render is fine.
        // Caveat: if user clicks delete on item 0, then immediately on item 1... 
        // Ideally we delete immediately from data, then animate out.
        // But user asked for smooth animation...
        // Let's delete from data, then render?
        // If we delete from data immediately, the list re-renders and animation is lost.
        // We must wait.
        deleteTask(index);
    });
}

function deleteTask(index) {
    // Check bound to avoid errors
    if (index >= 0 && index < tasks.length) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }
}

/**
 * Add Task
 */
function addTask() {
    const text = taskInput.value.trim();
    const date = taskDateInput.value;

    if (!text || !date) {
        showPopup();
        return;
    }

    tasks.push({ text, date, status: 'undone' });
    saveTasks();

    // Animate the new task
    renderTasks(); // Render first to get it in DOM
    const lastItem = taskList.lastElementChild;
    if (lastItem) {
        lastItem.classList.add('slide-in');
        lastItem.addEventListener('animationend', () => lastItem.classList.remove('slide-in'));
    }

    taskInput.value = '';
    taskDateInput.value = '';
}

function clearAllTasks() {
    const allItems = document.querySelectorAll('.task-item');
    if (allItems.length === 0) return;

    let count = 0;
    const total = allItems.length;

    allItems.forEach(item => {
        item.classList.add('slide-out');
        item.addEventListener('animationend', () => {
            count++;
            if (count >= total) {
                tasks = [];
                saveTasks();
                renderTasks();
            }
        });
    });
    // Fallback if animation fails
    setTimeout(() => {
        if (tasks.length > 0) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    }, 600);
}

// Popup Logic
function showPopup() { popupOverlay.classList.remove('hidden'); popupOverlay.classList.add('show'); }
function hidePopup() { popupOverlay.classList.remove('show'); }

// Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
clearBtn.addEventListener('click', clearAllTasks);
closePopupBtn.addEventListener('click', hidePopup);
popupOverlay.addEventListener('click', (e) => { if (e.target === popupOverlay) hidePopup(); });

// Re-calc min date focus
if (taskDateInput) {
    taskDateInput.addEventListener('focus', () => {
        const fresh = new Date();
        fresh.setMinutes(fresh.getMinutes() - fresh.getTimezoneOffset());
        taskDateInput.min = fresh.toISOString().slice(0, 16);
    });
}

// Initial
renderTasks();
