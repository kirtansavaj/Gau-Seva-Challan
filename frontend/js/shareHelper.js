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
        // 1. Fetch the Data
        const response = await fetch(`${API_URL}/challan/${id}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (!result.success) throw new Error("Failed to load data");
        const data = result.data;

        // 2. Fetch the HTML template
        const htmlRes = await fetch(`${window.location.origin}/print-receipt.html`);
        const htmlText = await htmlRes.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const receiptContainer = doc.getElementById('receiptContainer');

        // 3. Populate the template
        receiptContainer.querySelector('#challanNo').textContent = data.challanNo;
        receiptContainer.querySelector('#footerChallanNo').textContent = data.challanNo;
        receiptContainer.querySelector('#receiptDate').textContent = new Date(data.receiptDate).toLocaleDateString('en-IN');
        receiptContainer.querySelector('#paymentMode').textContent = data.paymentMode;
        receiptContainer.querySelector('#donationFor').textContent = data.donationFor;
        
        receiptContainer.querySelector('#donorName').textContent = data.donorName;
        receiptContainer.querySelector('#mobile').textContent = data.mobile;
        receiptContainer.querySelector('#address').textContent = data.address || '-';
        
        if (data.remarks) {
            receiptContainer.querySelector('#remarks').textContent = data.remarks;
            receiptContainer.querySelector('#remarksContainer').classList.remove('hidden');
        }
        
        receiptContainer.querySelector('#amount').textContent = data.amount.toLocaleString('en-IN');
        receiptContainer.querySelector('#amountInWords').textContent = numberToWords(data.amount);
        receiptContainer.querySelector('#collectedBy').textContent = data.collectedBy || 'Admin';

        // 4. Inject CSS for Google Fonts
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Serif+Gujarati:wght@400;600;700&display=swap');
        `;
        document.head.appendChild(style);

        // Inject the container into the body (off-screen but renderable)
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.width = '800px';
        wrapper.style.height = '1131px'; // A4 aspect ratio
        wrapper.style.zIndex = '-9999'; // Hide behind main content
        wrapper.style.pointerEvents = 'none';
        
        receiptContainer.style.position = 'relative';
        receiptContainer.style.left = '0';
        receiptContainer.style.top = '0';
        receiptContainer.style.width = '100%';
        receiptContainer.style.height = '100%';
        receiptContainer.style.backgroundColor = '#ffffff';
        receiptContainer.classList.remove('hidden');
        
        wrapper.appendChild(receiptContainer);
        document.body.appendChild(wrapper);

        // Wait a tiny bit for fonts and DOM layout to settle
        await new Promise(r => setTimeout(r, 300));

        // 5. Ensure html2pdf is loaded
        if (!window.html2pdf) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // 6. Generate PDF Blob
        const opt = {
            margin: 10,
            filename: `Receipt_${data.challanNo}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().set(opt).from(receiptContainer).outputPdf('blob');

        // Cleanup DOM
        document.body.removeChild(wrapper);
        document.head.removeChild(style);

        // 7. Share File
        const file = new File([pdfBlob], `Receipt_${data.challanNo}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Donation Receipt ${data.challanNo}`
            });
        } else {
            alert("File sharing is not supported on this browser. Downloading instead...");
            const link = document.createElement('a');
            link.href = URL.createObjectURL(pdfBlob);
            link.download = file.name;
            link.click();
        }

    } catch (error) {
        console.error("Error sharing PDF directly:", error);
        alert("Failed to generate and share the PDF.");
    }
}

window.sharePdfDirectly = sharePdfDirectly;
