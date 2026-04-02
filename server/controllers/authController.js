/**
 * TaskFlow - Authentication Controller
 * CP476A Internet Computing - Winter 2026
 *
 * Handles user registration, login, and logout logic.
 * Uses the MySQL database defined in server/config/database.js.
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

/**
 * Normalize a request value into a trimmed string.
 */
function normalizeString(value) {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).trim();
}

/**
 * Persist the authenticated user in the session store.
 */
function saveUserSession(req, user) {
    return new Promise(function (resolve, reject) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.email = user.email;

        req.session.save(function (error) {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

/**
 * POST /api/auth/register
 * Register a new user account.
 *
 * Expected body: { username, email, password }
 * Validates input, hashes password, and stores the user in MySQL.
 */
async function register(req, res) {
    try {
        var username = normalizeString(req.body.username);
        var email = normalizeString(req.body.email).toLowerCase();
        var password = normalizeString(req.body.password);

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

        // Check for duplicate username/email first so the UI gets a clean message.
        var [existingUsers] = await pool.execute(
            'SELECT username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );

        if (existingUsers.length > 0) {
            var existingUser = existingUsers[0];
            var duplicateMessage = existingUser.email === email
                ? 'An account with that email already exists.'
                : 'That username is already taken.';

            return res.status(409).json({
                success: false,
                message: duplicateMessage
            });
        }

        // Hash the password
        var passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert the new user into the database
        var [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            user: {
                id: result.insertId,
                username: username,
                email: email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'An account with that email or username already exists.'
            });
        }

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
 */
async function login(req, res) {
    try {
        var email = normalizeString(req.body.email).toLowerCase();
        var password = normalizeString(req.body.password);

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // Query user from database
        var [rows] = await pool.execute(
            'SELECT user_id, username, email, password_hash FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        var user = rows[0];

        // Verify credentials
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        var sessionUser = {
            id: user.user_id,
            username: user.username,
            email: user.email
        };

        // Set session
        await saveUserSession(req, sessionUser);

        res.json({
            success: true,
            message: 'Login successful.',
            user: sessionUser
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
    if (!req.session) {
        return res.json({
            success: true,
            message: 'Logged out successfully.'
        });
    }

    req.session.destroy(function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed.'
            });
        }

        // Clear the session cookie after destroying the server session.
        res.clearCookie('connect.sid');

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
            username: req.session.username,
            email: req.session.email
        }
    });
}

module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};
