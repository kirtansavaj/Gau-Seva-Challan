import { getAuthHeaders } from './auth.js';
import { generateTruePdfBlob } from './pdfGenerator.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Number to Words Converter for Indian Rupees
function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    return str.trim();
}

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
            
            // Handle print or download based on action param
            const action = urlParams.get('action');
            
            if (action === 'download' || action === 'share') {
                // Generate PDF and download/send
                try {
                    const blob = await generateTruePdfBlob(result.data);
                    
                    if (action === 'download') {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `Receipt_${result.data.challanNo}.pdf`;
                        link.click();
                        setTimeout(() => window.close(), 2000);
                    } else if (action === 'share') {
                        window.parent.postMessage({ type: 'SHARE_PDF', blob: blob }, '*');
                    }
                } catch(err) {
                    console.error("PDF Gen Error:", err);
                    if (action === 'share') window.parent.postMessage({ type: 'SHARE_ERROR' }, '*');
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
