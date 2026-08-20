import { getAuthHeaders } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function sharePdfDirectly(id) {
    try {
        // Fetch the Data
        const response = await fetch(`${API_URL}/challan/${id}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (!result.success) throw new Error("Failed to load data");
        const data = result.data;

        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '800px';
            iframe.style.height = '1131px';
            iframe.style.opacity = '0'; // Invisible but rendered
            iframe.style.pointerEvents = 'none';
            iframe.style.zIndex = '-1000';
            iframe.src = `${window.location.origin}/print-receipt.html?id=${id}&action=share`;

            const messageHandler = async (event) => {
                if (event.data && event.data.type === 'SHARE_PDF') {
                    window.removeEventListener('message', messageHandler);
                    if(document.body.contains(iframe)) document.body.removeChild(iframe);
                    
                    const blob = event.data.blob;
                    const file = new File([blob], `Receipt_${id}.pdf`, { type: 'application/pdf' });
                    const shareData = {
                        files: [file],
                        title: `Donation Receipt ${id}`
                    };
                    
                    try {
                        if (navigator.canShare && navigator.canShare(shareData)) {
                            await navigator.share(shareData);
                            resolve();
                        } else {
                            throw new Error("File sharing not supported by browser for this file type");
                        }
                    } catch (shareErr) {
                        console.error("Share failed or was cancelled:", shareErr);
                        if (shareErr.name === 'AbortError') {
                            return resolve();
                        }

                        alert("Sharing not supported on this device. Downloading instead...");
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = file.name;
                        link.click();
                        setTimeout(() => URL.revokeObjectURL(url), 2000);
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
            
            // Timeout after 15 seconds just in case
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                if(document.body.contains(iframe)) document.body.removeChild(iframe);
                reject(new Error("Timeout generating PDF"));
            }, 15000);
        });
    } catch (error) {
        console.error("Error sharing PDF directly:", error);
        alert("Failed to generate and share the PDF.");
    }
}

window.sharePdfDirectly = sharePdfDirectly;
