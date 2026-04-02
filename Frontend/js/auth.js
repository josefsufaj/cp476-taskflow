/**
 * TaskFlow - Authentication Module
 * Handles login and registration form validation and submission.
 * CP476A Internet Computing - Winter 2026
 */

document.addEventListener('DOMContentLoaded', function () {
    // ---- Login Form Handler ----
    var loginForm = document.getElementById('loginForm');

    // ---- Register Form Handler ----
    var registerForm = document.getElementById('registerForm');

    if (!loginForm && !registerForm) {
        return;
    }

    fetchCurrentUser()
        .then(function (user) {
            if (user) {
                sessionStorage.setItem('user', JSON.stringify(user));
                window.location.href = 'dashboard.html';
                return;
            }

            if (loginForm) {
                initLoginPage();
            }

            if (registerForm) {
                initRegisterPage();
            }
        })
        .catch(function () {
            if (loginForm) {
                initLoginPage();
            }

            if (registerForm) {
                initRegisterPage();
            }
        });
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
        apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: email, password: password })
        })
            .then(function (data) {
                // Store session info and redirect to dashboard
                sessionStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            })
            .catch(function (error) {
                // Show generic error (do not reveal which field is wrong)
                loginAlert.textContent = error.message || 'Invalid email or password.';
                loginAlert.classList.add('visible');
            });
    });
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
        apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        })
            .then(function () {
                window.location.href = 'login.html?registered=true';
            })
            .catch(function (error) {
                registerAlert.textContent = error.message || 'Registration failed. Please try again.';
                registerAlert.classList.add('visible');
            });
    });
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
