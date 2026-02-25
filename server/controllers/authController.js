/**
 * TaskFlow - Authentication Controller
 * CP476A Internet Computing - Winter 2026
 *
 * Handles user registration, login, and logout logic.
 * For Milestone 02, these are stub implementations that return
 * placeholder responses. Full database integration will be
 * completed in Milestone 03.
 */

const bcrypt = require('bcrypt');
// const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Register a new user account.
 *
 * Expected body: { username, email, password }
 * Validates input, hashes password, stores in database.
 */
async function register(req, res) {
    try {
        var { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        // Validate username length
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 20 characters.'
            });
        }

        // Validate email format
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Validate password strength
        if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with one letter and one number.'
            });
        }

        // Hash the password
        var passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // TODO (Milestone 03): Insert user into database
        // const [result] = await pool.execute(
        //     'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        //     [username, email, passwordHash]
        // );

        // Stub response for Milestone 02
        res.status(201).json({
            success: true,
            message: 'Account created successfully.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
}

/**
 * POST /api/auth/login
 * Authenticate a user and create a session.
 *
 * Expected body: { email, password }
 * Verifies credentials and sets session data.
 */
async function login(req, res) {
    try {
        var { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // TODO (Milestone 03): Query user from database
        // const [rows] = await pool.execute(
        //     'SELECT * FROM users WHERE email = ?',
        //     [email]
        // );
        // var user = rows[0];
        //
        // if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Invalid email or password.'
        //     });
        // }
        //
        // // Set session
        // req.session.userId = user.user_id;
        // req.session.username = user.username;

        // Stub response for Milestone 02
        res.json({
            success: true,
            message: 'Login successful.',
            user: {
                id: 1,
                username: 'demo_user',
                email: email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
}

/**
 * POST /api/auth/logout
 * Destroy the user's session and log them out.
 */
function logout(req, res) {
    req.session.destroy(function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed.'
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully.'
        });
    });
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user's info.
 */
function getCurrentUser(req, res) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated.'
        });
    }

    res.json({
        success: true,
        user: {
            id: req.session.userId,
            username: req.session.username
        }
    });
}

module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};
