import { getAuthHeaders } from './auth.js';
import { numberToWords } from './utils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        showError('No Challan ID provided.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/challan/${id}`, {
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            renderReceipt(result.data);
            
            // Hide loading, show receipt
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('receiptContainer').classList.remove('hidden');
            
            // Handle print action if param is set
            const action = urlParams.get('action');
            if (action === 'print') {
                setTimeout(() => {
                    window.print();
                }, 1000); // Give time for fonts to load
            }
        } else {
            showError(result.message || 'Failed to load challan data.');
        }
    } catch (error) {
        console.error('Error fetching challan:', error);
        showError('Network error while loading receipt.');
    }
});

function renderReceipt(data) {
    document.getElementById('challanNo').textContent = data.challanNo;
    document.getElementById('footerChallanNo').textContent = data.challanNo;
    document.getElementById('receiptDate').textContent = new Date(data.receiptDate).toLocaleDateString('en-IN');
    document.getElementById('paymentMode').textContent = data.paymentMode;
    document.getElementById('donationFor').textContent = data.donationFor;
    
    document.getElementById('donorName').textContent = data.donorName;
    document.getElementById('mobile').textContent = data.mobile;
    document.getElementById('address').textContent = data.address || '-';
    
    if (data.remarks) {
        document.getElementById('remarks').textContent = data.remarks;
        document.getElementById('remarksContainer').classList.remove('hidden');
    }
    
    document.getElementById('amount').textContent = data.amount.toLocaleString('en-IN');
    document.getElementById('amountInWords').textContent = numberToWords(data.amount);
    
    document.getElementById('collectedBy').textContent = data.collectedBy || 'Admin';
}

function showError(msg) {
    document.getElementById('loading').classList.add('hidden');
    const errEl = document.getElementById('errorMsg');
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
}
