// auth.js - Enforces authentication on protected pages

export function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

export function performLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUsername');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    const isLoginPage = window.location.pathname.endsWith('login.html');

    // Redirect to login if no token and not on login page
    if (!token && !isLoginPage) {
        window.location.href = 'login.html';
        return;
    }

    // Redirect to dashboard if they have a token and are on login page
    if (token && isLoginPage) {
        window.location.href = 'index.html';
        return;
    }

    // Auto-logout due to inactivity (1 hour)
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in ms
    let inactivityTimer;

    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(performLogout, INACTIVITY_LIMIT);
    };

    // Only set up inactivity timer if logged in and not on login page
    if (!isLoginPage && token) {
        resetInactivityTimer();
        const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        activityEvents.forEach(event => {
            window.addEventListener(event, resetInactivityTimer, { passive: true });
        });
    }

    // Set up logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            performLogout();
        });
    }
});

