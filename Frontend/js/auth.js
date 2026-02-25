/**
 * TaskFlow - Authentication Module
 * Handles login and registration form validation and submission.
 * CP476A Internet Computing - Winter 2026
 */

document.addEventListener('DOMContentLoaded', function () {

    // ---- Login Form Handler ----
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        initLoginPage();
    }

    // ---- Register Form Handler ----
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        initRegisterPage();
    }
});

/**
 * Initialize the login page functionality.
 */
function initLoginPage() {
    var form = document.getElementById('loginForm');
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    var toggleBtn = document.getElementById('togglePassword');
    var loginAlert = document.getElementById('loginAlert');
    var successAlert = document.getElementById('successAlert');

    // Check for registration success message in URL params
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        successAlert.textContent = 'Account created successfully! Please log in.';
        successAlert.classList.add('visible');
    }

    // Password visibility toggle
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            var type = passwordInput.getAttribute('type');
            passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
        });
    }

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();

        var email = emailInput.value.trim();
        var password = passwordInput.value;
        var isValid = true;

        // Validate email
        if (!email || !isValidEmail(email)) {
            showFieldError('emailError');
            isValid = false;
        }

        // Validate password
        if (!password) {
            showFieldError('passwordError');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Send login request to the server
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.success) {
                // Store session info and redirect to dashboard
                sessionStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                // Show generic error (do not reveal which field is wrong)
                loginAlert.textContent = data.message || 'Invalid email or password.';
                loginAlert.classList.add('visible');
            }
        })
        .catch(function () {
            // For Milestone 02: mock login with local storage
            mockLogin(email, password);
        });
    });

    /**
     * Mock login using localStorage (for front-end demo without live server).
     */
    function mockLogin(email, password) {
        var users = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
        var user = users.find(function (u) {
            return u.email === email && u.password === password;
        });

        if (user) {
            sessionStorage.setItem('user', JSON.stringify({
                id: user.id,
                username: user.username,
                email: user.email
            }));
            window.location.href = 'dashboard.html';
        } else {
            loginAlert.textContent = 'Invalid email or password.';
            loginAlert.classList.add('visible');
        }
    }
}

/**
 * Initialize the registration page functionality.
 */
function initRegisterPage() {
    var form = document.getElementById('registerForm');
    var usernameInput = document.getElementById('username');
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    var confirmPasswordInput = document.getElementById('confirmPassword');
    var registerAlert = document.getElementById('registerAlert');

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();

        var username = usernameInput.value.trim();
        var email = emailInput.value.trim();
        var password = passwordInput.value;
        var confirmPassword = confirmPasswordInput.value;
        var isValid = true;

        // Validate username: 3-20 characters
        if (!username || username.length < 3 || username.length > 20) {
            showFieldError('usernameError');
            isValid = false;
        }

        // Validate email
        if (!email || !isValidEmail(email)) {
            showFieldError('emailError');
            isValid = false;
        }

        // Validate password: min 8 chars, at least one letter and one number
        if (!password || password.length < 8 || !hasLetterAndNumber(password)) {
            showFieldError('passwordError');
            isValid = false;
        }

        // Validate confirm password
        if (password !== confirmPassword) {
            showFieldError('confirmPasswordError');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Send registration request to the server
        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.success) {
                window.location.href = 'login.html?registered=true';
            } else {
                registerAlert.textContent = data.message || 'Registration failed. Please try again.';
                registerAlert.classList.add('visible');
            }
        })
        .catch(function () {
            // For Milestone 02: mock registration with localStorage
            mockRegister(username, email, password);
        });
    });

    /**
     * Mock registration using localStorage (for front-end demo without live server).
     */
    function mockRegister(username, email, password) {
        var users = JSON.parse(localStorage.getItem('taskflow_users') || '[]');

        // Check for duplicate email or username
        var duplicate = users.find(function (u) {
            return u.email === email || u.username === username;
        });

        if (duplicate) {
            registerAlert.textContent = 'An account with that email or username already exists.';
            registerAlert.classList.add('visible');
            return;
        }

        // Create new user
        var newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('taskflow_users', JSON.stringify(users));

        // Redirect to login with success message
        window.location.href = 'login.html?registered=true';
    }
}

// ---- Utility Functions ----

/**
 * Validate email format using a basic regex.
 */
function isValidEmail(email) {
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

/**
 * Check if a string contains at least one letter and one number.
 */
function hasLetterAndNumber(str) {
    return /[a-zA-Z]/.test(str) && /[0-9]/.test(str);
}

/**
 * Show an individual field error message.
 */
function showFieldError(errorId) {
    var errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.classList.add('visible');
    }
}

/**
 * Clear all visible error messages on the page.
 */
function clearErrors() {
    var errors = document.querySelectorAll('.form-error');
    errors.forEach(function (el) {
        el.classList.remove('visible');
    });
    var alerts = document.querySelectorAll('.alert');
    alerts.forEach(function (el) {
        el.classList.remove('visible');
    });
}
