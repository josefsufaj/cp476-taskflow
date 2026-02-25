/**
 * TaskFlow - Task Controller
 * CP476A Internet Computing - Winter 2026
 *
 * Handles CRUD operations for tasks.
 * For Milestone 02, these are stub implementations with placeholder
 * responses. Full database integration will be completed in Milestone 03.
 */

// const { pool } = require('../config/database');

/**
 * GET /api/tasks
 * Retrieve all tasks for the authenticated user.
 * Supports optional query parameters: ?status=pending&priority=high
 */
async function getAllTasks(req, res) {
    try {
        var userId = req.session.userId;
        var { status, priority } = req.query;

        // TODO (Milestone 03): Query tasks from database with filters
        // var query = 'SELECT * FROM tasks WHERE user_id = ?';
        // var params = [userId];
        //
        // if (status && status !== 'all') {
        //     query += ' AND status = ?';
        //     params.push(status);
        // }
        // if (priority && priority !== 'all') {
        //     query += ' AND priority = ?';
        //     params.push(priority);
        // }
        //
        // query += ' ORDER BY due_date ASC, created_at DESC';
        // const [tasks] = await pool.execute(query, params);

        // Stub response for Milestone 02
        res.json({
            success: true,
            tasks: []
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
 * Only returns the task if it belongs to the authenticated user.
 */
async function getTaskById(req, res) {
    try {
        var userId = req.session.userId;
        var taskId = req.params.id;

        // TODO (Milestone 03): Query single task from database
        // const [rows] = await pool.execute(
        //     'SELECT * FROM tasks WHERE task_id = ? AND user_id = ?',
        //     [taskId, userId]
        // );
        //
        // if (rows.length === 0) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Task not found.'
        //     });
        // }

        // Stub response for Milestone 02
        res.json({
            success: true,
            task: null
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
 *
 * Expected body: { title, description, due_date, priority }
 */
async function createTask(req, res) {
    try {
        var userId = req.session.userId;
        var { title, description, due_date, priority } = req.body;

        // Input validation
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required.'
            });
        }

        if (title.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Title must not exceed 100 characters.'
            });
        }

        if (description && description.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Description must not exceed 500 characters.'
            });
        }

        // Validate priority value
        var validPriorities = ['low', 'medium', 'high'];
        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Priority must be low, medium, or high.'
            });
        }

        // TODO (Milestone 03): Insert task into database
        // const [result] = await pool.execute(
        //     `INSERT INTO tasks (user_id, title, description, due_date, priority, status)
        //      VALUES (?, ?, ?, ?, ?, 'pending')`,
        //     [userId, title.trim(), description || null, due_date || null, priority || 'medium']
        // );

        // Stub response for Milestone 02
        res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            task: {
                id: Date.now(),
                title: title.trim(),
                description: description || null,
                due_date: due_date || null,
                priority: priority || 'medium',
                status: 'pending'
            }
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
 *
 * Expected body: { title, description, due_date, priority, status }
 * Only updates the task if it belongs to the authenticated user.
 */
async function updateTask(req, res) {
    try {
        var userId = req.session.userId;
        var taskId = req.params.id;
        var { title, description, due_date, priority, status } = req.body;

        // Input validation
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required.'
            });
        }

        if (title.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Title must not exceed 100 characters.'
            });
        }

        // Validate status value
        var validStatuses = ['pending', 'in_progress', 'completed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be pending, in_progress, or completed.'
            });
        }

        // TODO (Milestone 03): Update task in database
        // const [result] = await pool.execute(
        //     `UPDATE tasks
        //      SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, updated_at = NOW()
        //      WHERE task_id = ? AND user_id = ?`,
        //     [title.trim(), description || null, due_date || null, priority || 'medium', status || 'pending', taskId, userId]
        // );
        //
        // if (result.affectedRows === 0) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Task not found or not authorized.'
        //     });
        // }

        // Stub response for Milestone 02
        res.json({
            success: true,
            message: 'Task updated successfully.'
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
 * Only deletes the task if it belongs to the authenticated user.
 */
async function deleteTask(req, res) {
    try {
        var userId = req.session.userId;
        var taskId = req.params.id;

        // TODO (Milestone 03): Delete task from database
        // const [result] = await pool.execute(
        //     'DELETE FROM tasks WHERE task_id = ? AND user_id = ?',
        //     [taskId, userId]
        // );
        //
        // if (result.affectedRows === 0) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Task not found or not authorized.'
        //     });
        // }

        // Stub response for Milestone 02
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
