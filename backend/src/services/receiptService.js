const PDFDocument = require('pdfkit');
const path = require('path');
const { numberToWords } = require('../utils/numberToWords');

/**
 * Generate a PDF receipt for a donation and return a Promise resolving to a Buffer
 * @param {Object} donation - The donation document from MongoDB
 * @returns {Promise<Buffer>} - The generated PDF buffer
 */
function generatePdfReceipt(donation) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Paths to fonts
            const englishFont = path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf');
            const gujaratiFont = path.join(__dirname, '../assets/fonts/NotoSansGujarati-Regular.ttf');

            // Register fonts
            doc.registerFont('English', englishFont);
            doc.registerFont('Gujarati', gujaratiFont);
            
            function renderMixedText(doc, text, x, y, options = {}) {
                if (!text) return;
                let segments = [];
                let currentLang = null;
                let currentSegment = '';

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const isGujarati = /[\u0A80-\u0AFF]/.test(char);
                    const isNeutral = /[\s0-9.,\-()\[\]:|]/.test(char);

                    let lang = currentLang || (isGujarati ? 'Gujarati' : 'English');
                    if (isGujarati) lang = 'Gujarati';
                    else if (!isNeutral) lang = 'English';
                    
                    if (lang !== currentLang && currentLang !== null && !isNeutral) {
                        segments.push({ text: currentSegment, lang: currentLang });
                        currentSegment = char;
                        currentLang = lang;
                    } else {
                        currentLang = lang;
                        currentSegment += char;
                    }
                }
                if (currentSegment) {
                    segments.push({ text: currentSegment, lang: currentLang });
                }

                let totalWidth = 0;
                for (const seg of segments) {
                    doc.font(seg.lang);
                    if (options.fontSize) doc.fontSize(options.fontSize);
                    totalWidth += doc.widthOfString(seg.text);
                }

                let currentX = x;
                if (options.align === 'center') {
                    currentX = x + (options.width || doc.page.width) / 2 - totalWidth / 2;
                } else if (options.align === 'right') {
                    currentX = x + (options.width || doc.page.width) - totalWidth;
                }

                for (const seg of segments) {
                    doc.font(seg.lang);
                    if (options.fontSize) doc.fontSize(options.fontSize);
                    doc.text(seg.text, currentX, y, { continued: false, lineBreak: false });
                    currentX += doc.widthOfString(seg.text);
                }
            }

            // Colors
            const primaryColor = '#16a34a'; // Green brand color
            const textColor = '#333333';
            const lightBorder = '#e5e7eb';

            // --- BACKGROUND WATERMARK ---
            const bgImagePath = path.join(__dirname, '../../assets/Gau Mata.jpeg');
            if (require('fs').existsSync(bgImagePath)) {
                doc.save();
                doc.opacity(0.15);
                // Center the watermark
                const imgWidth = 400;
                doc.image(bgImagePath, (doc.page.width - imgWidth) / 2, (doc.page.height - imgWidth) / 2 - 50, { width: imgWidth });
                doc.restore();
            }

            // --- HEADER ---
            // Draw a subtle background for the header
            doc.rect(0, 0, doc.page.width, 100).fill('#f0fdf4');
            
            doc.fillColor(primaryColor);
            renderMixedText(doc, 'Shree Gau Seva Trust - શ્રી ગૌ સેવા ટ્રસ્ટ', 0, 30, { align: 'center', fontSize: 24, width: doc.page.width });
            
            doc.fillColor('#4b5563');
            renderMixedText(doc, '123 Gaushala Road, Rajkot, Gujarat - 360001', 0, 60, { align: 'center', fontSize: 10, width: doc.page.width });
            renderMixedText(doc, 'Phone: +91 98765 43210 | Email: contact@gauseva.org', 0, 75, { align: 'center', fontSize: 10, width: doc.page.width });

            // Reset fill
            doc.fillColor(textColor);
            
            // --- TITLE & RECEIPT NO ---
            doc.moveDown(3);
            doc.fontSize(16).font('English').fillColor(primaryColor).text('DONATION RECEIPT', { align: 'center', underline: true });
            
            doc.moveDown(1);
            doc.fontSize(12).fillColor(textColor).font('English');
            
            const receiptNoY = doc.y;
            doc.text(`Receipt No: `, 50, receiptNoY, { continued: true }).font('English').text(donation.challanNo);
            
            // Format Date
            const receiptDate = new Date(donation.receiptDate || donation.createdAt);
            const dateStr = receiptDate.toLocaleDateString('en-IN');
            doc.text(`Date: ${dateStr}`, 0, receiptNoY, { align: 'right' });
            
            doc.moveDown(2);

            // --- DONOR INFORMATION ---
            doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#e5e7eb');
            doc.fillColor('#1f2937').font('English').fontSize(11).text('DONOR INFORMATION', 60, doc.y + 5);
            doc.moveDown(1);

            const donorStartY = doc.y + 10;
            const labelX = 60;
            const valueX = 180;
            const rightLabelX = 350;
            const rightValueX = 420;

            doc.fillColor(textColor).fontSize(11);
            
            // Name
            doc.font('English').text('Name:', labelX, donorStartY);
            renderMixedText(doc, donation.donorName, valueX, donorStartY, { fontSize: 11 });
            
            // Mobile
            doc.font('English').text('Mobile:', labelX, donorStartY + 20);
            renderMixedText(doc, donation.mobile, valueX, donorStartY + 20, { fontSize: 11 });

            // Address
            doc.font('English').text('Address:', labelX, donorStartY + 40);
            renderMixedText(doc, donation.address, valueX, donorStartY + 40, { fontSize: 11 });

            doc.moveDown(3);

            // --- DONATION DETAILS ---
            const detailsStartY = doc.y;
            doc.rect(50, detailsStartY, doc.page.width - 100, 20).fill('#e5e7eb');
            doc.fillColor('#1f2937').font('English').fontSize(11).text('DONATION DETAILS', 60, detailsStartY + 5);
            doc.moveDown(1);

            let rowY = doc.y + 10;

            // Draw table lines and text
            function drawRow(label, value, y) {
                doc.fillColor(textColor).font('English').text(label, labelX, y);
                renderMixedText(doc, value, valueX, y, { fontSize: 11 });
                doc.moveTo(50, y + 15).lineTo(doc.page.width - 50, y + 15).strokeColor(lightBorder).stroke();
            }

            drawRow('Donation Type:', donation.donationFor || 'General Fund', rowY);
            rowY += 25;
            
            drawRow('Payment Mode:', donation.paymentMode, rowY);
            rowY += 25;

            // Amount
            doc.fillColor(textColor).font('English').text('Donation Amount:', labelX, rowY);
            doc.font('English').fontSize(12).fillColor(primaryColor).text(`Rs. ${donation.amount.toLocaleString('en-IN')}`, valueX, rowY);
            doc.moveTo(50, rowY + 15).lineTo(doc.page.width - 50, rowY + 15).strokeColor(lightBorder).stroke();
            
            rowY += 25;
            
            // Amount in words
            const amountInWords = numberToWords(donation.amount);
            doc.fillColor(textColor).font('English').fontSize(11).text('Amount in Words:', labelX, rowY);
            doc.font('English').text(amountInWords, valueX, rowY);
            doc.moveTo(50, rowY + 15).lineTo(doc.page.width - 50, rowY + 15).strokeColor(lightBorder).stroke();

            // --- PAYMENT STATUS ---
            rowY += 35;
            doc.rect(50, rowY, doc.page.width - 100, 30).fill('#f0fdf4').strokeColor(primaryColor).stroke();
            doc.fillColor(primaryColor).font('English').fontSize(12).text('Payment Status: PAID', 0, rowY + 9, { align: 'center' });

            // --- FOOTER ---
            const footerY = doc.page.height - 150;
            
            // Collector name
            doc.fillColor(textColor);
            const collectorName = donation.collectedBy || 'Admin';
            renderMixedText(doc, `Collected By: ${collectorName}`, doc.page.width - 200, footerY, { width: 150, align: 'center', fontSize: 10 });

            doc.moveDown(3);
            doc.fontSize(10).font('English').fillColor('#6b7280')
               .text('Thank you for your valuable contribution.', 50, footerY + 30, { align: 'center' })
               .text('This is a computer generated receipt and does not require a physical signature.', { align: 'center' });

            // Finalize PDF file
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generatePdfReceipt };
