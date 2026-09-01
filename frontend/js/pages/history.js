import { challanApi } from '../api/challanApi.js';

let currentPage = 1;
const limit = 15;
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    loadHistoryData();
    initSearch();
    initPagination();
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

async function loadHistoryData() {
    try {
        const data = await challanApi.getHistoryData(currentPage, limit, currentSearchQuery);

        if (data && data.success) {
            renderHistoryTable(data.data.donations);
            updatePaginationControls(data.data.currentPage, data.data.totalPages);
        } else if (data && !data.success) {
            showToast(data.message || 'Failed to load history', 'error');
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading data.</td></tr>';
        }
    } catch (error) {
        showToast('Failed to load history', 'error');
        console.error(error);
    }
}

function renderHistoryTable(donations) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (donations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No donations found.</td></tr>';
        return;
    }

    donations.forEach(d => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td data-label="Challan No"><strong>${d.challanNo}</strong></td>
            <td data-label="Date">${new Date(d.receiptDate).toLocaleDateString('en-IN')}</td>
            <td data-label="Donor Name">${d.donorName}</td>
            <td data-label="Mobile">${d.mobile}</td>
            <td data-label="Amount">₹ ${d.amount.toLocaleString('en-IN')}</td>
            <td data-label="Mode">${d.paymentMode}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePaginationControls(current, total) {
    currentPage = current;
    document.getElementById('pageInfo').textContent = `Page ${current} of ${total || 1}`;

    document.getElementById('prevPage').disabled = current <= 1;
    document.getElementById('nextPage').disabled = current >= total;
}

function initPagination() {
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadHistoryData();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        loadHistoryData();
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    let timeout = null;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            currentSearchQuery = e.target.value.trim();
            currentPage = 1; // reset to first page on new search
            loadHistoryData();
        }, 500);
    });
}

function updatePagination() {
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

async function deleteChallan(id) {
    if (!confirm('Are you sure you want to delete this challan? This action cannot be undone.')) {
        return;
    }

    try {
        const data = await challanApi.deleteChallan(id);

        if (data.success) {
            showToast('Challan deleted successfully');
            loadHistoryData();
        } else {
            showToast(data.message || 'Failed to delete', 'error');
        }
    } catch (error) {
        showToast('Error deleting challan', 'error');
    }
}
window.deleteChallan = deleteChallan;
