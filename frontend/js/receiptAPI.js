import { getAuthHeaders } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL + '/challan';

export async function fetchReceiptBlob(id) {
    const response = await fetch(`${API_URL}/${id}/receipt`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to generate receipt');
    }

    // Extract filename from Content-Disposition header if possible
    let filename = `Donation-Receipt-${id}.pdf`;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename="([^"]*)"/.exec(disposition);
        if (matches != null && matches[1]) {
            filename = matches[1];
        }
    }

    const blob = await response.blob();
    return { blob, filename };
}

export async function viewReceipt(id) {
    try {
        const { blob } = await fetchReceiptBlob(id);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Revoke the URL after a delay to free memory
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
        console.error(error);
        alert('Failed to view receipt. Please try again.');
    }
}

export async function downloadReceipt(id) {
    try {
        const { blob, filename } = await fetchReceiptBlob(id);
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error(error);
        alert('Failed to download receipt. Please try again.');
    }
}

export async function shareReceipt(id) {
    try {
        const { blob, filename } = await fetchReceiptBlob(id);
        const file = new File([blob], filename, { type: 'application/pdf' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Donation Receipt',
                text: 'Here is the donation receipt.'
            });
        } else {
            // Fallback to download
            alert('File sharing is not supported on this browser. Downloading instead.');
            downloadReceipt(id);
        }
    } catch (error) {
        console.error(error);
        if (error.name !== 'AbortError') { // User didn't cancel the share
            alert('Failed to share receipt. Please try again.');
        }
    }
}
