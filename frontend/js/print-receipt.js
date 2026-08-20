import { getAuthHeaders } from './auth.js';
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
            
            if (action === 'download' || action === 'share') {
                // Wait for Tailwind to inject styles
                const waitForTailwind = () => new Promise(resolve => {
                    const styleEl = document.getElementById('tailwind-style');
                    if (styleEl && styleEl.innerHTML.length > 0) return resolve();
                    const observer = new MutationObserver(() => {
                        const el = document.getElementById('tailwind-style');
                        if (el && el.innerHTML.length > 0) {
                            observer.disconnect();
                            resolve();
                        }
                    });
                    observer.observe(document.head, { childList: true, subtree: true });
                    setTimeout(resolve, 2500); // fallback
                });

                await waitForTailwind();

                // Give DOM extra time to paint fonts and logo
                setTimeout(() => {
                    const element = document.getElementById('receiptContainer');
                    const opt = {
                        margin: 0,
                        filename: `Receipt_${result.data.challanNo}.pdf`,
                        image: { type: 'jpeg', quality: 1.0 },
                        html2canvas: { scale: 2, useCORS: true, windowWidth: 800, scrollY: 0 },
                        pagebreak: { mode: ['avoid-all'] },
                        jsPDF: { unit: 'px', format: [800, 1131], orientation: 'portrait' }
                    };

                    if (action === 'download') {
                        html2pdf().set(opt).from(element).save().then(() => {
                            setTimeout(() => window.close(), 1000);
                        });
                    } else if (action === 'share') {
                        html2pdf().set(opt).from(element).outputPdf('blob').then(blob => {
                            window.parent.postMessage({ type: 'SHARE_PDF', blob: blob }, '*');
                        }).catch(err => {
                            console.error(err);
                            window.parent.postMessage({ type: 'SHARE_ERROR' }, '*');
                        });
                    }
                }, 500);

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
