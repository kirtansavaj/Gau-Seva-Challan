document.addEventListener('DOMContentLoaded', () => {
    // Universal Mobile Sidebar Navigation Toggle
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    let overlay = document.getElementById('sidebarOverlay');

    if (navbar && mobileMenuBtn) {
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
