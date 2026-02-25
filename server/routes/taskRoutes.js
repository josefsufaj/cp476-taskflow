/**
 * TaskFlow - Task Routes
 * CP476A Internet Computing - Winter 2026
 *
 * Defines RESTful routes for task CRUD operations.
 * Routes are mounted at /api/tasks in server.js.
 * All routes require authentication (checked via session middleware).
 */

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Middleware: ensure user is authenticated before accessing task routes
router.use(function (req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }
    next();
});

// GET /api/tasks - Retrieve all tasks for the logged-in user
router.get('/', taskController.getAllTasks);

// GET /api/tasks/:id - Retrieve a single task by ID
router.get('/:id', taskController.getTaskById);

// POST /api/tasks - Create a new task
router.post('/', taskController.createTask);

// PUT /api/tasks/:id - Update an existing task
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
