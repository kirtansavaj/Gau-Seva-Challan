import { getAuthHeaders } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    initSearch();
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

async function loadDashboardData(searchQuery = '') {
    try {
        let url = API_URL;
        if (searchQuery) {
            url = `${API_URL}/search?q=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url, { headers: getAuthHeaders() });
        const data = await response.json();

        if (data.success) {
            updateDashboardStats(data.data.donations);
            renderDonationsTable(data.data.donations);
        }
    } catch (error) {
        showToast('Failed to load data', 'error');
        console.error(error);
    }
}

function updateDashboardStats(donations) {
    let todayTotal = 0;
    let monthTotal = 0;
    let allTimeTotal = 0;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    donations.forEach(d => {
        const date = new Date(d.receiptDate);
        allTimeTotal += d.amount;

        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            monthTotal += d.amount;
        }

        if (date.toDateString() === today.toDateString()) {
            todayTotal += d.amount;
        }
    });

    document.getElementById('todayTotal').textContent = `₹ ${todayTotal.toLocaleString('en-IN')}`;
    document.getElementById('monthTotal').textContent = `₹ ${monthTotal.toLocaleString('en-IN')}`;
    document.getElementById('allTimeTotal').textContent = `₹ ${allTimeTotal.toLocaleString('en-IN')}`;
    document.getElementById('receiptCount').textContent = donations.length;
}

function renderDonationsTable(donations) {
    const tbody = document.getElementById('recentDonationsTable');
    tbody.innerHTML = '';

    if (donations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No donations found.</td></tr>';
        return;
    }

    donations.slice(0, 10).forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${d.challanNo}</strong></td>
            <td>${new Date(d.receiptDate).toLocaleDateString('en-IN')}</td>
            <td>${d.donorName}</td>
            <td>₹ ${d.amount.toLocaleString('en-IN')}</td>
            <td>
                <button class="action-btn" title="View/Print PDF" onclick="viewPdf('${d._id}')"><i class='bx bx-printer'></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewPdf(id) {
    window.open(`print-receipt.html?id=${id}&action=print`, '_blank');
}

window.viewPdf = viewPdf;


function initSearch() {
    const searchInput = document.getElementById('searchInput');
    let timeout = null;

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadDashboardData(e.target.value);
        }, 500);
    });
}
