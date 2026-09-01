import { challanApi } from '../api/challanApi.js';

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
        const data = await challanApi.getDashboardData(searchQuery);

        if (data && data.success) {
            updateDashboardStats(data.data.donations);
            renderDonationsTable(data.data.donations);
        } else if (data && !data.success) {
            showToast(data.message || 'Failed to load data', 'error');
            const tbody = document.getElementById('recentDonationsTable');
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading data.</td></tr>';
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
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No donations found.</td></tr>';
        return;
    }

    donations.slice(0, 10).forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Challan No"><strong>${d.challanNo}</strong></td>
            <td data-label="Date">${new Date(d.receiptDate).toLocaleDateString('en-IN')}</td>
            <td data-label="Donor Name">${d.donorName}</td>
            <td data-label="Amount">₹ ${d.amount.toLocaleString('en-IN')}</td>
        `;
        tbody.appendChild(tr);
    });
}

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
