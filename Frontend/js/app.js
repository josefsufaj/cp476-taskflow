/**
 * TaskFlow - Dashboard Application Module
 * Handles task CRUD operations, filtering, and UI interactions.
 * Uses mock data via localStorage for Milestone 02 (will connect to API in Milestone 03).
 * CP476A Internet Computing - Winter 2026
 */

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    var user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Display username in header
    document.getElementById('usernameDisplay').textContent = user.username;

    // Initialize the dashboard
    initDashboard(user);
});

/**
 * Main initialization function for the dashboard.
 * Sets up event listeners and renders the initial task list.
 */
function initDashboard(user) {
    // DOM element references
    var addTaskBtn = document.getElementById('addTaskBtn');
    var emptyAddTaskBtn = document.getElementById('emptyAddTaskBtn');
    var logoutBtn = document.getElementById('logoutBtn');
    var filterStatus = document.getElementById('filterStatus');
    var filterPriority = document.getElementById('filterPriority');

    // Modal elements
    var taskModal = document.getElementById('taskModal');
    var taskModalTitle = document.getElementById('taskModalTitle');
    var taskModalClose = document.getElementById('taskModalClose');
    var taskCancelBtn = document.getElementById('taskCancelBtn');
    var taskForm = document.getElementById('taskForm');
    var statusGroup = document.getElementById('statusGroup');

    // Delete modal elements
    var deleteModal = document.getElementById('deleteModal');
    var deleteTaskName = document.getElementById('deleteTaskName');
    var deleteCancelBtn = document.getElementById('deleteCancelBtn');
    var deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

    // State
    var editingTaskId = null;
    var deletingTaskId = null;

    // ---- Event Listeners ----

    // Add Task buttons
    addTaskBtn.addEventListener('click', function () {
        openTaskModal('add');
    });
    emptyAddTaskBtn.addEventListener('click', function () {
        openTaskModal('add');
    });

    // Logout
    logoutBtn.addEventListener('click', function () {
        sessionStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Filter changes
    filterStatus.addEventListener('change', renderTasks);
    filterPriority.addEventListener('change', renderTasks);

    // Task modal close/cancel
    taskModalClose.addEventListener('click', closeTaskModal);
    taskCancelBtn.addEventListener('click', closeTaskModal);
    taskModal.addEventListener('click', function (e) {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // Delete modal close/cancel
    deleteCancelBtn.addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', function (e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });

    // Task form submission
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleTaskSubmit();
    });

    // Delete confirmation
    deleteConfirmBtn.addEventListener('click', function () {
        handleDeleteConfirm();
    });

    // ---- Modal Functions ----

    /**
     * Open the task modal in add or edit mode.
     * @param {string} mode - 'add' or 'edit'
     * @param {object|null} task - Task object to edit (null for add)
     */
    function openTaskModal(mode, task) {
        // Reset form
        taskForm.reset();
        clearFormErrors();

        if (mode === 'edit' && task) {
            taskModalTitle.textContent = 'Edit Task';
            editingTaskId = task.id;
            statusGroup.style.display = 'block';

            // Pre-populate form fields
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskDueDate').value = task.due_date || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
        } else {
            taskModalTitle.textContent = 'Add New Task';
            editingTaskId = null;
            statusGroup.style.display = 'none';

            // Set default priority to medium
            document.getElementById('taskPriority').value = 'medium';
        }

        taskModal.classList.add('active');
    }

    /**
     * Close the task modal and reset state.
     */
    function closeTaskModal() {
        taskModal.classList.remove('active');
        editingTaskId = null;
    }

    /**
     * Open the delete confirmation modal.
     * @param {number} taskId - ID of the task to delete
     * @param {string} taskTitle - Title to display in the dialog
     */
    function openDeleteModal(taskId, taskTitle) {
        deletingTaskId = taskId;
        deleteTaskName.textContent = '"' + taskTitle + '"';
        deleteModal.classList.add('active');
    }

    /**
     * Close the delete confirmation modal.
     */
    function closeDeleteModal() {
        deleteModal.classList.remove('active');
        deletingTaskId = null;
    }

    // ---- Task CRUD Operations ----

    /**
     * Get all tasks for the current user from localStorage.
     * @returns {Array} Array of task objects
     */
    function getTasks() {
        var key = 'taskflow_tasks_' + user.id;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    /**
     * Save tasks array to localStorage for the current user.
     * @param {Array} tasks - Array of task objects
     */
    function saveTasks(tasks) {
        var key = 'taskflow_tasks_' + user.id;
        localStorage.setItem(key, JSON.stringify(tasks));
    }

    /**
     * Handle task form submission for both create and edit.
     */
    function handleTaskSubmit() {
        clearFormErrors();

        var title = document.getElementById('taskTitle').value.trim();
        var description = document.getElementById('taskDescription').value.trim();
        var dueDate = document.getElementById('taskDueDate').value;
        var priority = document.getElementById('taskPriority').value;
        var status = document.getElementById('taskStatus').value;
        var isValid = true;

        // Validate title
        if (!title || title.length > 100) {
            showFormError('taskTitleError');
            isValid = false;
        }

        // Validate due date (cannot be in the past for new tasks)
        if (!dueDate) {
            showFormError('taskDueDateError');
            isValid = false;
        } else if (!editingTaskId) {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var selectedDate = new Date(dueDate + 'T00:00:00');
            if (selectedDate < today) {
                document.getElementById('taskDueDateError').textContent = 'Due date cannot be in the past.';
                showFormError('taskDueDateError');
                isValid = false;
            }
        }

        if (!isValid) {
            return;
        }

        var tasks = getTasks();

        if (editingTaskId) {
            // Update existing task
            tasks = tasks.map(function (task) {
                if (task.id === editingTaskId) {
                    return {
                        id: task.id,
                        user_id: user.id,
                        title: title,
                        description: description,
                        due_date: dueDate,
                        priority: priority,
                        status: status,
                        created_at: task.created_at,
                        updated_at: new Date().toISOString()
                    };
                }
                return task;
            });
        } else {
            // Create new task
            var newTask = {
                id: Date.now(),
                user_id: user.id,
                title: title,
                description: description,
                due_date: dueDate,
                priority: priority,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            tasks.push(newTask);
        }

        saveTasks(tasks);
        closeTaskModal();
        renderTasks();
    }

    /**
     * Handle delete confirmation.
     */
    function handleDeleteConfirm() {
        if (!deletingTaskId) return;

        var tasks = getTasks();
        tasks = tasks.filter(function (task) {
            return task.id !== deletingTaskId;
        });

        saveTasks(tasks);
        closeDeleteModal();
        renderTasks();
    }

    /**
     * Toggle task completion status via checkbox.
     * @param {number} taskId - ID of the task
     */
    function toggleTaskComplete(taskId) {
        var tasks = getTasks();
        tasks = tasks.map(function (task) {
            if (task.id === taskId) {
                task.status = task.status === 'completed' ? 'pending' : 'completed';
                task.updated_at = new Date().toISOString();
            }
            return task;
        });
        saveTasks(tasks);
        renderTasks();
    }

    // ---- Rendering ----

    /**
     * Render the task list based on current filters.
     */
    function renderTasks() {
        var tasks = getTasks();
        var statusFilter = filterStatus.value;
        var priorityFilter = filterPriority.value;

        // Apply filters
        var filtered = tasks.filter(function (task) {
            var matchStatus = statusFilter === 'all' || task.status === statusFilter;
            var matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            return matchStatus && matchPriority;
        });

        // Sort by due date (soonest first), then by created_at
        filtered.sort(function (a, b) {
            if (a.due_date && b.due_date) {
                return new Date(a.due_date) - new Date(b.due_date);
            }
            if (a.due_date && !b.due_date) return -1;
            if (!a.due_date && b.due_date) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        var taskListEl = document.getElementById('taskList');
        var emptyState = document.getElementById('emptyState');
        var taskListHeader = document.getElementById('taskListHeader');

        // Show/hide empty state
        if (filtered.length === 0) {
            taskListEl.innerHTML = '';
            taskListHeader.style.display = 'none';
            if (tasks.length === 0) {
                emptyState.querySelector('h3').textContent = 'No tasks yet';
                emptyState.querySelector('p').textContent = 'Get started by creating your first task';
            } else {
                emptyState.querySelector('h3').textContent = 'No tasks found';
                emptyState.querySelector('p').textContent = 'Try adjusting your filters';
            }
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        taskListHeader.style.display = 'grid';

        // Build task list HTML
        var html = '';
        filtered.forEach(function (task) {
            var isCompleted = task.status === 'completed';
            var isOverdue = !isCompleted && task.due_date && new Date(task.due_date + 'T23:59:59') < new Date();

            html += '<div class="task-item' + (isCompleted ? ' completed' : '') + '" data-id="' + task.id + '">';

            // Checkbox
            html += '<div>';
            html += '<input type="checkbox" class="task-checkbox" ' +
                    (isCompleted ? 'checked' : '') +
                    ' data-task-id="' + task.id + '" title="Mark as ' +
                    (isCompleted ? 'incomplete' : 'complete') + '">';
            html += '</div>';

            // Title
            html += '<div class="task-title">' + escapeHtml(task.title) + '</div>';

            // Due Date
            html += '<div class="task-due-date' + (isOverdue ? ' overdue' : '') + '">';
            if (task.due_date) {
                html += formatDate(task.due_date);
            } else {
                html += '<span style="color: var(--gray-400);">No date</span>';
            }
            html += '</div>';

            // Priority Badge
            html += '<div><span class="badge badge-' + task.priority + '">' + task.priority + '</span></div>';

            // Status Badge
            html += '<div><span class="badge badge-' + task.status + '">' + formatStatus(task.status) + '</span></div>';

            // Actions
            html += '<div class="task-actions">';
            html += '<button class="btn-icon edit-btn" data-task-id="' + task.id + '" title="Edit task">&#9998;</button>';
            html += '<button class="btn-icon delete btn-delete" data-task-id="' + task.id + '" title="Delete task">&#128465;</button>';
            html += '</div>';

            html += '</div>';
        });

        taskListEl.innerHTML = html;

        // Attach event listeners to dynamically created elements
        attachTaskEventListeners();
    }

    /**
     * Attach click event listeners to task action buttons and checkboxes.
     */
    function attachTaskEventListeners() {
        // Checkbox toggle
        var checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(function (cb) {
            cb.addEventListener('change', function () {
                var taskId = parseInt(this.getAttribute('data-task-id'));
                toggleTaskComplete(taskId);
            });
        });

        // Edit buttons
        var editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var taskId = parseInt(this.getAttribute('data-task-id'));
                var tasks = getTasks();
                var task = tasks.find(function (t) { return t.id === taskId; });
                if (task) {
                    openTaskModal('edit', task);
                }
            });
        });

        // Delete buttons
        var deleteBtns = document.querySelectorAll('.btn-delete');
        deleteBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var taskId = parseInt(this.getAttribute('data-task-id'));
                var tasks = getTasks();
                var task = tasks.find(function (t) { return t.id === taskId; });
                if (task) {
                    openDeleteModal(taskId, task.title);
                }
            });
        });
    }

    // ---- Helper Functions ----

    /**
     * Format a date string (YYYY-MM-DD) to a more readable format.
     */
    function formatDate(dateStr) {
        var parts = dateStr.split('-');
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[2]) + ', ' + parts[0];
    }

    /**
     * Format a status value to a human-readable label.
     */
    function formatStatus(status) {
        var labels = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed'
        };
        return labels[status] || status;
    }

    /**
     * Escape HTML characters to prevent XSS.
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show a form validation error.
     */
    function showFormError(errorId) {
        var el = document.getElementById(errorId);
        if (el) el.classList.add('visible');
    }

    /**
     * Clear all form validation errors.
     */
    function clearFormErrors() {
        var errors = document.querySelectorAll('.form-error');
        errors.forEach(function (el) {
            el.classList.remove('visible');
        });
    }

    // ---- Initial Render ----
    renderTasks();
}
