import { authApi } from '../api/challanApi.js';

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('token')) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('loginError');
    const loginBtn = document.querySelector('.login-btn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) return;

        // Visual feedback
        const originalBtnText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Signing in...';
        loginBtn.disabled = true;
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }

        try {
            const data = await authApi.login(username, password);

            if (data.success) {
                // Store token and redirect
                localStorage.setItem('token', data.token);
                localStorage.setItem('adminUsername', data.admin.username);
                window.location.href = 'index.html';
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            if (errorMessage) {
                errorMessage.innerHTML = `<i class='bx bx-error-circle'></i> ${error.message}`;
                errorMessage.style.display = 'flex';
            } else {
                alert(error.message);
            }
        } finally {
            loginBtn.innerHTML = originalBtnText;
            loginBtn.disabled = false;
        }
    });
});
