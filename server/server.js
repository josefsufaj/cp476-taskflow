/**
 * TaskFlow - Server Entry Point
 * CP476A Internet Computing - Winter 2026
 *
 * This file initializes the Express server, configures middleware,
 * registers routes, and starts listening for incoming requests.
 */

const express = require('express');
const path = require('path');
const session = require('express-session');

// Load environment variables (if .env file exists)
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv not configured, using defaults.');
}

const { testConnection } = require('./config/database');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'taskflow-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,       // Set to true with HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));

// Serve static files from the front-end directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---- API Routes ----

// Authentication routes: /api/auth/login, /api/auth/register, /api/auth/logout
app.use('/api/auth', authRoutes);

// Task routes: /api/tasks (CRUD operations)
app.use('/api/tasks', taskRoutes);

// ---- Default Route ----

// Redirect root to login page
app.get('/', function (req, res) {
    res.redirect('/login.html');
});

// ---- Error Handling ----

// 404 handler
app.use(function (req, res) {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// General error handler
app.use(function (err, req, res, next) {
    console.error('Server error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ---- Start Server ----
async function startServer() {
    var dbConnected = await testConnection();

    if (!dbConnected) {
        console.warn('Starting server without a verified database connection.');
    }

    app.listen(PORT, function () {
        console.log('=================================');
        console.log('  TaskFlow Server');
        console.log('  Running on http://localhost:' + PORT);
        console.log('=================================');
    });
}

startServer();

module.exports = app;
