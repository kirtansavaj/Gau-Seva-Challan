import { authApi } from '../api/challanApi.js';

document.addEventListener('DOMContentLoaded', () => {
    initProfile();
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function initProfile() {
    const adminUsername = localStorage.getItem('adminUsername') || 'Admin';
    
    // Fill current data
    document.getElementById('displayUsername').textContent = adminUsername;
    document.getElementById('username').value = adminUsername;
    
    // Update sidebar widgets
    const sidebars = document.querySelectorAll('#sidebarAdminName');
    sidebars.forEach(el => el.textContent = adminUsername);
    
    const avatars = document.querySelectorAll('.profile-avatar, .large-avatar');
    avatars.forEach(el => el.textContent = adminUsername.charAt(0).toUpperCase());

    const form = document.getElementById('profileForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSave = document.getElementById('btnSave');
        const originalText = btnSave.innerHTML;
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';

        const username = document.getElementById('username').value.trim();

        try {
            const result = await authApi.updateProfile(username);
            
            if (result.success) {
                showToast('Profile updated successfully!');
                
                // Update local storage and UI
                localStorage.setItem('adminUsername', result.admin.username);
                document.getElementById('displayUsername').textContent = result.admin.username;
                
                sidebars.forEach(el => el.textContent = result.admin.username);
                avatars.forEach(el => el.textContent = result.admin.username.charAt(0).toUpperCase());
            } else {
                showToast(result.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            showToast('Failed to connect to server', 'error');
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalText;
        }
    });
}
