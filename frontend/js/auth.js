    // auth.js - Enforces authentication on protected pages

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

    // Set up logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('adminUsername');
            window.location.href = 'login.html';
        });
    }

    // Universal Mobile Sidebar Navigation Toggle
    const navbar = document.querySelector('.navbar');
    const topHeader = document.querySelector('.top-header');

    if (navbar && topHeader) {
        let mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (!mobileMenuBtn) {
            mobileMenuBtn = document.createElement('button');
            mobileMenuBtn.id = 'mobileMenuBtn';
            mobileMenuBtn.className = 'mobile-menu-btn';
            mobileMenuBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
            mobileMenuBtn.innerHTML = '<i class="bx bx-menu"></i>';
            topHeader.insertBefore(mobileMenuBtn, topHeader.firstChild);
        }

        let overlay = document.getElementById('sidebarOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        const toggleMenu = (open) => {
            if (open === undefined) {
                const isOpen = navbar.classList.contains('active');
                toggleMenu(!isOpen);
            } else if (open) {
                navbar.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                navbar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        overlay.addEventListener('click', () => toggleMenu(false));

        const navLinks = navbar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => toggleMenu(false));
        });
    }
});

// Helper to get auth headers for fetch calls
export function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// Helper to append token to PDF URLs
export function getAuthUrl(url) {
    const token = localStorage.getItem('token');
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
}

window.getAuthHeaders = getAuthHeaders;
window.getAuthUrl = getAuthUrl;

