/**
 * TaskFlow - Dashboard Application Module
 * Handles task CRUD operations, filtering, and UI interactions.
 * Uses the API for all task and session state.
 * CP476A Internet Computing - Winter 2026
 */

document.addEventListener('DOMContentLoaded', function () {
    bootstrapDashboard();
});

/**
 * Send an API request and normalize JSON success/error handling.
 */
function apiRequest(url, options) {
    var requestOptions = Object.assign({
        credentials: 'same-origin'
    }, options || {});

    requestOptions.headers = Object.assign({
        'Content-Type': 'application/json'
    }, requestOptions.headers || {});

    return fetch(url, requestOptions)
        .then(function (response) {
            return response
                .json()
                .catch(function () {
                    return {};
                })
                .then(function (data) {
                    if (!response.ok || !data.success) {
                        var error = new Error(data.message || 'Request failed.');
                        error.status = response.status;
                        throw error;
                    }

                    return data;
                });
        });
}

/**
 * Fetch the currently authenticated user from the server session.
 */
function fetchCurrentUser() {
    return apiRequest('/api/auth/me')
        .then(function (data) {
            return data.user;
        })
        .catch(function (error) {
            if (error.status === 401) {
                return null;
            }

            throw error;
        });
}

/**
 * Verify the current session before initializing the dashboard.
 */
function bootstrapDashboard() {
    fetchCurrentUser()
        .then(function (user) {
            if (!user) {
                sessionStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }

            sessionStorage.setItem('user', JSON.stringify(user));
            document.getElementById('usernameDisplay').textContent = user.username;
            initDashboard();
        })
        .catch(function () {
            sessionStorage.removeItem('user');
            window.location.href = 'login.html';
        });
}

/**
 * Main initialization function for the dashboard.
 * Sets up event listeners and renders the initial task list.
 */
function initDashboard() {
    // DOM element references
    var addTaskBtn = document.getElementById('addTaskBtn');
    var emptyAddTaskBtn = document.getElementById('emptyAddTaskBtn');
    var dashboardAlert = document.getElementById('dashboardAlert');
    var logoutBtn = document.getElementById('logoutBtn');
    var taskSearch = document.getElementById('taskSearch');
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
    var tasks = [];
    var editingTaskId = null;
    var deletingTaskId = null;
    var searchDebounceTimer = null;

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
        apiRequest('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({})
        })
            .catch(function () {
                return null;
            })
            .finally(function () {
                sessionStorage.removeItem('user');
                window.location.href = 'login.html';
            });
    });

    // Filter changes
    filterStatus.addEventListener('change', loadTasks);
    filterPriority.addEventListener('change', loadTasks);
    taskSearch.addEventListener('input', function () {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        searchDebounceTimer = setTimeout(function () {
            loadTasks();
        }, 250);
    });

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
     * Find a task in the current in-memory list.
     * @param {number} taskId - ID of the task
     * @returns {object|null} Matching task or null
     */
    function findTask(taskId) {
        return tasks.find(function (task) {
            return task.id === taskId;
        }) || null;
    }

    function showDashboardAlert(message) {
        if (!dashboardAlert) {
            return;
        }

        dashboardAlert.textContent = message;
        dashboardAlert.classList.add('visible');
    }

    function clearDashboardAlert() {
        if (!dashboardAlert) {
            return;
        }

        dashboardAlert.textContent = '';
        dashboardAlert.classList.remove('visible');
    }

    function handleUnauthorized(error) {
        if (error.status === 401) {
            sessionStorage.removeItem('user');
            window.location.href = 'login.html';
            return true;
        }

        return false;
    }

    /**
     * Load tasks for the current user from the API.
     */
    function loadTasks() {
        clearDashboardAlert();

        var query = new URLSearchParams();
        var searchValue = taskSearch.value.trim();

        if (filterStatus.value !== 'all') {
            query.set('status', filterStatus.value);
        }

        if (filterPriority.value !== 'all') {
            query.set('priority', filterPriority.value);
        }

        if (searchValue) {
            query.set('search', searchValue);
        }

        var url = '/api/tasks';
        if (query.toString()) {
            url += '?' + query.toString();
        }

        apiRequest(url)
            .then(function (data) {
                tasks = data.tasks || [];
                renderTasks();
            })
            .catch(function (error) {
                tasks = [];
                renderTasks();

                if (handleUnauthorized(error)) {
                    return;
                }

                showDashboardAlert(error.message || 'Failed to load tasks.');
            });
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

        clearDashboardAlert();

        var payload = {
            title: title,
            description: description,
            due_date: dueDate,
            priority: priority,
            status: editingTaskId ? status : 'pending'
        };

        var request = editingTaskId
            ? apiRequest('/api/tasks/' + editingTaskId, {
                method: 'PUT',
                body: JSON.stringify(payload)
            })
            : apiRequest('/api/tasks', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

        request
            .then(function () {
                closeTaskModal();
                loadTasks();
            })
            .catch(function (error) {
                if (handleUnauthorized(error)) {
                    return;
                }

                showDashboardAlert(error.message || 'Failed to save task.');
            });
    }

    /**
     * Handle delete confirmation.
     */
    function handleDeleteConfirm() {
        if (!deletingTaskId) {
            return;
        }

        clearDashboardAlert();

        apiRequest('/api/tasks/' + deletingTaskId, {
            method: 'DELETE',
            body: JSON.stringify({})
        })
            .then(function () {
                closeDeleteModal();
                loadTasks();
            })
            .catch(function (error) {
                if (handleUnauthorized(error)) {
                    return;
                }

                showDashboardAlert(error.message || 'Failed to delete task.');
            });
    }

    /**
     * Toggle task completion status via checkbox.
     * @param {number} taskId - ID of the task
     */
    function toggleTaskComplete(taskId) {
        var task = findTask(taskId);

        if (!task) {
            return;
        }

        clearDashboardAlert();

        apiRequest('/api/tasks/' + taskId, {
            method: 'PUT',
            body: JSON.stringify({
                title: task.title,
                description: task.description || '',
                due_date: task.due_date || '',
                priority: task.priority,
                status: task.status === 'completed' ? 'pending' : 'completed'
            })
        })
            .then(function () {
                loadTasks();
            })
            .catch(function (error) {
                if (handleUnauthorized(error)) {
                    return;
                }

                showDashboardAlert(error.message || 'Failed to update task.');
                loadTasks();
            });
    }

    // ---- Rendering ----

    /**
     * Render the task list based on current filters.
     */
    function renderTasks() {
        var taskListEl = document.getElementById('taskList');
        var emptyState = document.getElementById('emptyState');
        var taskListHeader = document.getElementById('taskListHeader');
        var hasActiveFilters = filterStatus.value !== 'all' || filterPriority.value !== 'all';
        var hasSearch = taskSearch.value.trim() !== '';

        // Show/hide empty state
        if (tasks.length === 0) {
            taskListEl.innerHTML = '';
            taskListHeader.style.display = 'none';

            if (hasSearch && hasActiveFilters) {
                emptyState.querySelector('h3').textContent = 'No matching tasks';
                emptyState.querySelector('p').textContent = 'Try changing your search or filters';
            } else if (hasSearch) {
                emptyState.querySelector('h3').textContent = 'No matching tasks';
                emptyState.querySelector('p').textContent = 'Try a different search term';
            } else if (hasActiveFilters) {
                emptyState.querySelector('h3').textContent = 'No tasks found';
                emptyState.querySelector('p').textContent = 'Try adjusting your filters';
            } else {
                emptyState.querySelector('h3').textContent = 'No tasks yet';
                emptyState.querySelector('p').textContent = 'Get started by creating your first task';
            }
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        taskListHeader.style.display = 'grid';

        // Build task list HTML
        var html = '';
        tasks.forEach(function (task) {
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
                var taskId = parseInt(this.getAttribute('data-task-id'), 10);
                toggleTaskComplete(taskId);
            });
        });

        // Edit buttons
        var editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var taskId = parseInt(this.getAttribute('data-task-id'), 10);
                var task = findTask(taskId);
                if (task) {
                    openTaskModal('edit', task);
                }
            });
        });

        // Delete buttons
        var deleteBtns = document.querySelectorAll('.btn-delete');
        deleteBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var taskId = parseInt(this.getAttribute('data-task-id'), 10);
                var task = findTask(taskId);
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
        return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
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
        if (el) {
            el.classList.add('visible');
        }
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
    loadTasks();
}
