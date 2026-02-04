// Select DOM elements
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const pendingCount = document.getElementById('pending-count');
const clearBtn = document.getElementById('clear-btn');

// Initialize tasks from LocalStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

/**
 * Save tasks to LocalStorage
 */
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updatePendingCount();
}

/**
 * Update the pending tasks counter
 */
function updatePendingCount() {
    const count = tasks.filter(task => !task.completed).length;
    pendingCount.textContent = `You have ${count} pending task${count !== 1 ? 's' : ''}`;
}

/**
 * Create a DOM element for a task
 * @param {Object} task - The task object
 * @param {number} index - The index of the task in the array
 * @param {boolean} animate - Whether to animate entry
 */
function createTaskElement(task, index, animate = false) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;

    // Add animation class if requested
    if (animate) {
        li.classList.add('slide-in');
        // Remove animation class after it completes to avoid re-triggering issues
        li.addEventListener('animationend', () => {
            li.classList.remove('slide-in');
        });
    }

    // Task text span
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;
    span.addEventListener('click', () => toggleTask(index));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent toggling when deleting
        handleDeleteAnimation(li, index);
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);

    return li;
}

/**
 * Handle deletion with animation
 * @param {HTMLElement} element - The DOM element to animate
 * @param {number} index - The index of the task to delete
 */
function handleDeleteAnimation(element, index) {
    element.classList.add('slide-out');

    // Wait for animation to finish before removing from DOM and state
    element.addEventListener('animationend', () => {
        deleteTask(index);
    });
}


/**
 * Render the entire task list
 */
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        taskList.appendChild(taskElement);
    });
    updatePendingCount();
}

/**
 * Add a new task
 */
function addTask() {
    const text = taskInput.value.trim();
    if (text) {
        tasks.push({ text, completed: false });
        saveTasks();

        // Render efficiently: Append the new task instead of re-rendering whole list
        // Note: For simplicity with index-based logic, we re-render usually,
        // but to animate we can handle just this one.
        // However, standard renderTasks clears list. 
        // Strategy: Append directly to DOM, then re-sync or just append.

        // Better: Clear list and re-render BUT making sure the *last* one animates?
        // Or simpler: Just append new element.

        // Let's just create the element and append it.
        // Index is length - 1
        const newTaskIndex = tasks.length - 1;
        const newTaskElement = createTaskElement(tasks[newTaskIndex], newTaskIndex, true);
        taskList.appendChild(newTaskElement);

        taskInput.value = '';
        updatePendingCount();
    }
}

/**
 * Toggle task completion status
 * @param {number} index 
 */
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    // Re-render to update classes. 
    // Optimization: could just toggle class on DOM element.
    renderTasks();
}

/**
 * Delete a specific task
 * @param {number} index 
 */
function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

/**
 * Clear all tasks
 */
function clearAllTasks() {
    // Animate all out?
    const allItems = document.querySelectorAll('.task-item');
    if (allItems.length === 0) return;

    let removedCount = 0;
    allItems.forEach(item => {
        item.classList.add('slide-out');
        item.addEventListener('animationend', () => {
            removedCount++;
            if (removedCount === allItems.length) {
                tasks = [];
                saveTasks();
                renderTasks();
            }
        });
    });
}

// Event Listeners
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearBtn.addEventListener('click', clearAllTasks);

// Initial Render
renderTasks();
