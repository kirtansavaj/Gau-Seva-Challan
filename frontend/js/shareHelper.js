import { getAuthHeaders } from './auth.js';
import { generateTruePdfBlob } from './pdfGenerator.js';

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

        // Generate True PDF Blob
        const blob = await generateTruePdfBlob(data);
        const file = new File([blob], `Receipt_${data.challanNo}.pdf`, { type: 'application/pdf' });
        const shareData = {
            files: [file],
            title: `Donation Receipt ${data.challanNo}`
        };

        try {
            // Explicitly test capability with the actual generated file
            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                throw new Error("File sharing not supported by browser for this file type");
            }
        } catch (shareErr) {
            console.error("Share failed or was cancelled:", shareErr);
            // If the user manually cancelled the share dialog, do NOT force a download
            if (shareErr.name === 'AbortError') {
                return;
            }

            // Fallback for unsupported browsers or actual failures
            alert("Sharing not supported on this device. Downloading instead...");
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            
            // Prevent memory leaks
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
    } catch (error) {
        console.error("Error sharing PDF directly:", error);
        alert("Failed to generate and share the PDF.");
    }
}

window.sharePdfDirectly = sharePdfDirectly;
