import { challanApi } from '../api/challanApi.js';
import { viewReceipt, shareReceipt, downloadReceipt } from '../receiptAPI.js';
let currentChallanId = null;

document.addEventListener('DOMContentLoaded', () => {
    initForm();
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

function initForm() {
    const form = document.getElementById('donationForm');
    const resetBtn = document.getElementById('btnReset');

    const donorNamesContainer = document.getElementById('donorNamesContainer');

    const addDonorBtn = document.getElementById('addDonorBtn');
    if (addDonorBtn && donorNamesContainer) {
        addDonorBtn.addEventListener('click', () => {
            const group = document.createElement('div');
            group.className = 'donor-name-input-group';
            group.style.display = 'flex';
            group.style.gap = '0.5rem';
            group.style.marginBottom = '0.5rem';
            
            group.innerHTML = `
                <input type="text" class="donorNameInput" required minlength="3" placeholder="Enter additional name" style="flex: 1;">
                <button type="button" class="btn-icon remove-donor-btn" style="color: var(--danger); width: 48px; height: 48px; background: var(--surface-bg); border: 1px solid var(--border); border-radius: var(--border-radius-sm);"><i class='bx bx-minus-circle' style="font-size: 1.5rem;"></i></button>
            `;
            donorNamesContainer.appendChild(group);
            
            group.querySelector('.remove-donor-btn').addEventListener('click', () => {
                group.remove();
            });
        });
    }

    resetBtn.addEventListener('click', () => {
        form.reset();
        if (donorNamesContainer) {
            const extraNames = donorNamesContainer.querySelectorAll('.donor-name-input-group:not(:first-of-type)');
            extraNames.forEach(el => el.remove());
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSave = document.getElementById('btnSave');
        btnSave.disabled = true;
        btnSave.textContent = 'Saving...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.amount = Number(data.amount);

        // Gather multiple donor names
        const donorNameInputs = document.querySelectorAll('.donorNameInput');
        const names = Array.from(donorNameInputs).map(input => input.value.trim()).filter(val => val !== '');
        data.donorName = names.join(' & '); // Join names with &


        try {
            const result = await challanApi.createChallan(data);
            
            if (result.success) {
                showToast('Challan generated successfully!');
                form.reset();
                if (donorNamesContainer) {
                    const extraNames = donorNamesContainer.querySelectorAll('.donor-name-input-group:not(:first-of-type)');
                    extraNames.forEach(el => el.remove());
                }
                showReceiptModal(result.data);
            } else {
                showToast(result.message || 'Validation failed', 'error');
            }
        } catch (error) {
            showToast('Failed to connect to server', 'error');
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Save Challan';
        }
    });
}

function showReceiptModal(donation) {
    currentChallanId = donation._id;
    const modal = document.getElementById('receiptModal');
    const preview = document.getElementById('receiptPreviewData');
    
    preview.innerHTML = `
        <p><strong>Challan No:</strong> ${donation.challanNo}</p>
        <p><strong>Donor Name:</strong> ${donation.donorName}</p>
        <p><strong>Amount:</strong> ₹ ${donation.amount.toLocaleString('en-IN')}</p>
        <p><strong>Date:</strong> ${new Date(donation.receiptDate).toLocaleDateString('en-IN')}</p>
        <p><strong>Payment Mode:</strong> ${donation.paymentMode}</p>
        <p><strong>Collected By:</strong> ${donation.collectedBy || 'Admin'}</p>
    `;
    
    modal.classList.remove('hidden');
}

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('receiptModal').classList.add('hidden');
});

document.querySelector('.close-modal-btn').addEventListener('click', () => {
    document.getElementById('receiptModal').classList.add('hidden');
});

document.getElementById('btnViewPdf').addEventListener('click', () => {
    if (currentChallanId) viewReceipt(currentChallanId);
});

document.getElementById('btnDownloadPdf').addEventListener('click', () => {
    if (currentChallanId) downloadReceipt(currentChallanId);
});

document.getElementById('btnSharePdf').addEventListener('click', () => {
    if (currentChallanId) shareReceipt(currentChallanId);
});
