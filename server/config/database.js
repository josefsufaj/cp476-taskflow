/**
 * TaskFlow - Database Configuration
 * CP476A Internet Computing - Winter 2026
 *
 * Configures and exports the MySQL database connection pool.
 * Uses environment variables for credentials (see .env.example).
 *
 * NOTE: For Milestone 02, the database is set up but not yet fully
 * integrated with the front-end. Full integration will be completed
 * in Milestone 03.
 */

const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'taskflow_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create a connection pool for efficient database access
const pool = mysql.createPool(dbConfig);

/**
 * Test the database connection.
 * Call this on server startup to verify connectivity.
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully.');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.error('Make sure MySQL is running and credentials are correct.');
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
