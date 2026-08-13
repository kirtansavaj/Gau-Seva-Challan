const path = require('path');
process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, '../../.cache/puppeteer');

const puppeteer = require('puppeteer');
const ejs = require('ejs');
const QRCode = require('qrcode');
const fs = require('fs');

let globalBrowser = null;

const getExecutablePath = () => {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return undefined;
};

const getBrowser = async () => {
    if (!globalBrowser || !globalBrowser.connected) {
        const executablePath = getExecutablePath();
        const launchOptions = {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        };
        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }
        globalBrowser = await puppeteer.launch(launchOptions);
    }
    return globalBrowser;
};

// Simple number to words converter for INR
function numberToWords(num) {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
}

const resolveAssetPath = (filename) => {
    const candidates = [
        path.join(__dirname, '../../assets', filename),
        path.join(__dirname, '../../../', filename),
        path.join('d:', 'Gaw Donation', filename)
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
};

const generateHtml = async (donation) => {
    // Generate QR Code data
    const qrDataString = `Challan: ${donation.challanNo}\nDonor: ${donation.donorName}\nAmount: ₹${donation.amount}`;
    const qrCodeData = await QRCode.toDataURL(qrDataString);

    const amountInWords = numberToWords(donation.amount);

    // Read background image as base64
    let bgImageData = '';
    let headerLogoData = '';
    let sealData = '';
    try {
        const bgPath = resolveAssetPath('Gau Mata.png');
        if (bgPath) {
            bgImageData = `data:image/png;base64,${fs.readFileSync(bgPath).toString('base64')}`;
        }
        
        const logoPath = resolveAssetPath('Logo-removebg-preview.png');
        if (logoPath) {
            headerLogoData = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
        }

        const sealPath = resolveAssetPath('seal.png');
        if (sealPath) {
            sealData = `data:image/png;base64,${fs.readFileSync(sealPath).toString('base64')}`;
        }
    } catch (e) {
        console.error('Failed to read images:', e);
    }

    // Render HTML using EJS
    const templatePath = path.join(__dirname, '../templates/challan.ejs');
    return await ejs.renderFile(templatePath, {
        donation,
        qrCodeData,
        amountInWords,
        bgImageData,
        headerLogoData,
        sealData
    });
};

const generatePdf = async (donation) => {
    try {
        const html = await generateHtml(donation);

        // Launch Puppeteer and generate PDF
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await page.close();

        return pdfBuffer;
    } catch (error) {
        throw new Error('PDF Generation failed: ' + error.message);
    }
};

module.exports = {
    generatePdf,
    generateHtml
};
