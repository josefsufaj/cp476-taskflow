/**
 * TaskFlow - Authentication Routes
 * CP476A Internet Computing - Winter 2026
 *
 * Defines routes for user registration, login, and logout.
 * Routes are mounted at /api/auth in server.js.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Register a new user account
router.post('/register', authController.register);

// POST /api/auth/login - Log in an existing user
router.post('/login', authController.login);

// POST /api/auth/logout - Log out the current user
router.post('/logout', authController.logout);

// GET /api/auth/me - Get the currently logged-in user info
router.get('/me', authController.getCurrentUser);

module.exports = router;
