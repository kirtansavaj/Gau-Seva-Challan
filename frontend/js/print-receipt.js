import { getAuthHeaders } from './auth.js';
import { generateTruePdfBlob } from './pdfGenerator.js';
import { sharePdfDirectly } from './shareHelper.js';
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

            // Attach Share Button Event
            const shareBtn = document.getElementById('shareBtn');
            if (shareBtn) {
                shareBtn.addEventListener('click', async () => {
                    const originalText = shareBtn.innerHTML;
                    shareBtn.innerHTML = '<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Preparing...';
                    await sharePdfDirectly(id);
                    shareBtn.innerHTML = originalText;
                });
            }
            
            // Handle print or download based on action param
            const action = urlParams.get('action');
            
            if (action === 'download') {
                // Generate PDF and download
                try {
                    const blob = await generateTruePdfBlob(result.data);
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Receipt_${result.data.challanNo}.pdf`;
                    link.click();
                    
                    // Revoke URL to prevent memory leaks, then close tab
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                        window.close();
                    }, 2000);
                } catch(err) {
                    console.error("PDF Gen Error:", err);
                    showError("Failed to generate PDF for download.");
                }
            } else {
                // Print mode
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
