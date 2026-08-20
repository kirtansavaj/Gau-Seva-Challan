import { getAuthHeaders } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Number to Words Converter for Indian Rupees (copied from print-receipt.js)
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

export async function sharePdfDirectly(id) {
    if (!navigator.share || !navigator.canShare) {
        alert("Your device doesn't support direct file sharing. Please use 'Download' instead.");
        return;
    }

    try {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '100vw'; // Hide completely offscreen
            iframe.style.width = '800px';
            iframe.style.height = '1131px';
            iframe.src = `${window.location.origin}/print-receipt.html?id=${id}&action=share`;

            const messageHandler = async (event) => {
                if (event.data && event.data.type === 'SHARE_PDF') {
                    window.removeEventListener('message', messageHandler);
                    if(document.body.contains(iframe)) document.body.removeChild(iframe);
                    
                    const blob = event.data.blob;
                    const file = new File([blob], `Receipt_${id}.pdf`, { type: 'application/pdf' });
                    
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Donation Receipt ${id}`
                        });
                        resolve();
                    } catch (shareErr) {
                        console.error("Share failed or was cancelled:", shareErr);
                        // Fallback if sharing is aborted or fails
                        if (shareErr.name !== 'AbortError') {
                            alert("Sharing failed. Downloading instead...");
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = file.name;
                            link.click();
                        }
                        resolve();
                    }
                } else if (event.data && event.data.type === 'SHARE_ERROR') {
                    window.removeEventListener('message', messageHandler);
                    if(document.body.contains(iframe)) document.body.removeChild(iframe);
                    alert("Failed to generate PDF");
                    reject(new Error("PDF generation failed in iframe"));
                }
            };

            window.addEventListener('message', messageHandler);
            document.body.appendChild(iframe);
            
            // Timeout after 10 seconds just in case
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                if(document.body.contains(iframe)) document.body.removeChild(iframe);
                reject(new Error("Timeout generating PDF"));
            }, 10000);
        });

    } catch (error) {
        console.error("Error sharing PDF directly:", error);
        alert("Failed to generate and share the PDF.");
    }
}

window.sharePdfDirectly = sharePdfDirectly;
