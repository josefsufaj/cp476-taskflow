/**
 * TaskFlow - Task Controller
 * CP476A Internet Computing - Winter 2026
 *
 * Handles CRUD operations for tasks.
 */

const { pool } = require('../config/database');

var TASK_SELECT = [
    'SELECT',
    '    task_id,',
    '    user_id,',
    '    title,',
    '    description,',
    "    DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,",
    '    priority,',
    '    status,',
    "    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,",
    "    DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') AS updated_at",
    'FROM tasks'
].join('\n');

function normalizeString(value) {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).trim();
}

function normalizeOptionalString(value) {
    var normalized = normalizeString(value);
    return normalized ? normalized : null;
}

function parseTaskId(taskIdValue) {
    var taskId = parseInt(taskIdValue, 10);
    return Number.isInteger(taskId) && taskId > 0 ? taskId : null;
}

function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    var date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function mapTask(row) {
    return {
        id: row.task_id,
        user_id: row.user_id,
        title: row.title,
        description: row.description,
        due_date: row.due_date,
        priority: row.priority,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

function validateTaskInput(body) {
    var title = normalizeString(body.title);
    var description = normalizeOptionalString(body.description);
    var dueDate = normalizeOptionalString(body.due_date);
    var priority = normalizeString(body.priority) || 'medium';
    var status = normalizeString(body.status) || 'pending';
    var validPriorities = ['low', 'medium', 'high'];
    var validStatuses = ['pending', 'in_progress', 'completed'];

    if (!title) {
        return { message: 'Task title is required.' };
    }

    if (title.length > 100) {
        return { message: 'Title must not exceed 100 characters.' };
    }

    if (description && description.length > 500) {
        return { message: 'Description must not exceed 500 characters.' };
    }

    if (dueDate && !isValidDateString(dueDate)) {
        return { message: 'Due date must be a valid date in YYYY-MM-DD format.' };
    }

    if (!validPriorities.includes(priority)) {
        return { message: 'Priority must be low, medium, or high.' };
    }

    if (!validStatuses.includes(status)) {
        return { message: 'Status must be pending, in_progress, or completed.' };
    }

    return {
        data: {
            title: title,
            description: description,
            due_date: dueDate,
            priority: priority,
            status: status
        }
    };
}

async function getTaskForUser(taskId, userId) {
    var [rows] = await pool.execute(
        TASK_SELECT + '\nWHERE task_id = ? AND user_id = ?',
        [taskId, userId]
    );

    return rows[0] ? mapTask(rows[0]) : null;
}

/**
 * GET /api/tasks
 * Retrieve all tasks for the authenticated user.
 * Supports optional query parameters: ?status=pending&priority=high&search=report
 */
async function getAllTasks(req, res) {
    try {
        var userId = req.session.userId;
        var status = req.query.status;
        var priority = req.query.priority;
        var search = normalizeString(req.query.search);
        var validStatuses = ['pending', 'in_progress', 'completed'];
        var validPriorities = ['low', 'medium', 'high'];
        var query = TASK_SELECT + '\nWHERE user_id = ?';
        var params = [userId];

        if (status && status !== 'all') {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status filter.'
                });
            }

            query += '\nAND status = ?';
            params.push(status);
        }

        if (priority && priority !== 'all') {
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid priority filter.'
                });
            }

            query += '\nAND priority = ?';
            params.push(priority);
        }

        if (search) {
            query += '\nAND (title LIKE ? OR description LIKE ?)';
            params.push('%' + search + '%', '%' + search + '%');
        }

        query += '\nORDER BY due_date IS NULL, due_date ASC, created_at DESC';

        var [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            tasks: rows.map(mapTask)
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tasks.'
        });
    }
}

/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID.
 */
async function getTaskById(req, res) {
    try {
        var userId = req.session.userId;
        var taskId = parseTaskId(req.params.id);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID.'
            });
        }

        var task = await getTaskForUser(taskId, userId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        res.json({
            success: true,
            task: task
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve task.'
        });
    }
}

/**
 * POST /api/tasks
 * Create a new task for the authenticated user.
 */
async function createTask(req, res) {
    try {
        var userId = req.session.userId;
        var validation = validateTaskInput(req.body);

        if (validation.message) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        var taskData = validation.data;
        var [result] = await pool.execute(
            [
                'INSERT INTO tasks (user_id, title, description, due_date, priority, status)',
                'VALUES (?, ?, ?, ?, ?, ?)'
            ].join('\n'),
            [
                userId,
                taskData.title,
                taskData.description,
                taskData.due_date,
                taskData.priority,
                'pending'
            ]
        );

        var createdTask = await getTaskForUser(result.insertId, userId);

        res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            task: createdTask
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create task.'
        });
    }
}

/**
 * PUT /api/tasks/:id
 * Update an existing task.
 */
async function updateTask(req, res) {
    try {
        var userId = req.session.userId;
        var taskId = parseTaskId(req.params.id);
        var validation = validateTaskInput(req.body);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID.'
            });
        }

        if (validation.message) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        var taskData = validation.data;
        var [result] = await pool.execute(
            [
                'UPDATE tasks',
                'SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, updated_at = NOW()',
                'WHERE task_id = ? AND user_id = ?'
            ].join('\n'),
            [
                taskData.title,
                taskData.description,
                taskData.due_date,
                taskData.priority,
                taskData.status,
                taskId,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        var updatedTask = await getTaskForUser(taskId, userId);

        res.json({
            success: true,
            message: 'Task updated successfully.',
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task.'
        });
    }
}

/**
 * DELETE /api/tasks/:id
 * Delete a task by ID.
 */
async function deleteTask(req, res) {
    try {
        var userId = req.session.userId;
        var taskId = parseTaskId(req.params.id);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID.'
            });
        }

        var [result] = await pool.execute(
            'DELETE FROM tasks WHERE task_id = ? AND user_id = ?',
            [taskId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully.'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete task.'
        });
    }
}

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
