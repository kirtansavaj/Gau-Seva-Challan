const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { numberToWords } = require('../utils/numberToWords');

/**
 * Generate a PDF receipt for a donation and return a Promise resolving to a Buffer
 * @param {Object} donation - The donation document from MongoDB
 * @returns {Promise<Buffer>} - The generated PDF buffer
 */
function generatePdfReceipt(donation) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 0, size: 'A4' }); // Use 0 margin for full control over borders
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Fonts
            const englishFont = path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf');
            const gujaratiFont = path.join(__dirname, '../assets/fonts/NotoSansGujarati-Regular.ttf');
            
            doc.registerFont('English', englishFont);
            doc.registerFont('Gujarati', gujaratiFont);
            doc.registerFont('Serif', 'Times-Bold'); // Built-in
            doc.registerFont('Italic', 'Times-Italic'); // Built-in

            // Mixed text renderer
            function renderMixedText(doc, text, x, y, options = {}) {
                if (!text) return;
                let segments = [];
                let currentLang = null;
                let currentSegment = '';

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const isGujarati = /[\u0A80-\u0AFF]/.test(char);
                    const isNeutral = /[\s0-9.,\-()\[\]:|&₹]/.test(char);

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

                let currentY = y + (options.yOffset || 0);
                for (const seg of segments) {
                    doc.font(seg.lang);
                    if (options.fontSize) doc.fontSize(options.fontSize);
                    doc.text(seg.text, currentX, currentY, { continued: false, lineBreak: false });
                    currentX += doc.widthOfString(seg.text);
                }
            }

            // Colors
            const cDarkGreen = '#114E24';
            const cRed = '#B22222';
            const cBeige = '#FCF8F2';
            const cBrown = '#C89F6B';
            const cTextBrown = '#5B2C15';
            const cTextBlack = '#1A1A1A';
            
            // --- BORDER ---
            // Outer golden border
            doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30)
               .lineWidth(2)
               .strokeColor(cBrown)
               .stroke();
            // Inner thin border
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
               .lineWidth(0.5)
               .strokeColor(cBrown)
               .stroke();

            // Corner decorative arcs (simple approximation)
            const drawCorner = (x, y, flipX, flipY) => {
                doc.save();
                doc.translate(x, y);
                doc.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                doc.moveTo(0, 30).quadraticCurveTo(0, 0, 30, 0).lineWidth(1).strokeColor(cBrown).stroke();
                doc.restore();
            };
            drawCorner(25, 25, false, false);
            drawCorner(doc.page.width - 25, 25, true, false);
            drawCorner(25, doc.page.height - 25, false, true);
            drawCorner(doc.page.width - 25, doc.page.height - 25, true, true);

            // Helper to draw SVG icons
            const drawIcon = (pathStr, x, y, size, color) => {
                doc.save();
                doc.translate(x, y);
                doc.scale(size / 24); // SVG icons are 24x24
                doc.path(pathStr).fill(color);
                doc.restore();
            };

            const icons = {
                location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
                email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
                receipt: 'M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z',
                calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z',
                user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                hands: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
                gift: 'M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z',
                payment: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
                check: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
            };

            // --- HEADER ---
            const logoPath = path.join(__dirname, '../assets/images/logo-transparent.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 40, { width: 100 });
            }

            // Trust Name (English) - Reduced size and centered to fit new longer name
            doc.fillColor(cDarkGreen).font('Serif').fontSize(24).text('VAISHNAV GAU SEVA PARIVAR', 160, 45, {
                width: 400,
                align: 'center'
            });
            
            // Trust Name (Gujarati)
            doc.fillColor(cTextBrown);
            renderMixedText(doc, 'શ્રી ગૌ સેવા ટ્રસ્ટ', 160, 78, { align: 'center', fontSize: 24, width: 400 });

            // Contact info - Phone numbers only, perfectly centered under the title
            doc.fillColor(cTextBlack).font('English').fontSize(12);
            
            const phoneStr = '98251 55382   |   99792 27675   |   99249 00147';
            const phoneTextWidth = doc.widthOfString(phoneStr);
            const phoneTotalWidth = 20 + phoneTextWidth; // 12px icon + 8px gap
            const phoneStartX = 360 - (phoneTotalWidth / 2);
            
            // Push icon down by 3px to visually align with the NotoSans text baseline
            drawIcon(icons.phone, phoneStartX, 128, 12, cTextBlack);
            doc.text(phoneStr, phoneStartX + 20, 125);

            // --- DONATION RECEIPT BANNER ---
            const bannerY = 170;
            doc.save();
            doc.fillColor(cDarkGreen);
            // Custom banner shape
            doc.path('M 60 190 L 80 170 L 515 170 L 535 190 L 515 210 L 80 210 Z').fill();
            doc.fillColor('white').font('Serif').fontSize(22).text('DONATION RECEIPT', 0, 180, { align: 'center' });
            doc.restore();

            // --- RECEIPT NO & DATE BOXES ---
            const boxY = 230;
            
            // Receipt No Box
            doc.rect(50, boxY, 210, 30).fillAndStroke(cBeige, cBrown);
            drawIcon(icons.receipt, 65, boxY + 5, 20, cTextBrown);
            doc.fillColor(cTextBlack).font('Serif').fontSize(12).text('Receipt No: ', 95, boxY + 10);
            doc.font('English').text(donation.challanNo, 165, boxY + 6);

            // Date Box
            doc.rect(335, boxY, 210, 30).fillAndStroke(cBeige, cBrown);
            drawIcon(icons.calendar, 350, boxY + 5, 20, cTextBrown);
            const receiptDate = new Date(donation.receiptDate || donation.createdAt).toLocaleDateString('en-IN');
            doc.fillColor(cTextBlack).font('Serif').fontSize(12).text('Date: ', 380, boxY + 10);
            doc.font('English').text(receiptDate, 420, boxY + 6);

            // --- DONOR INFORMATION BOX ---
            const donorY = 280;
            doc.roundedRect(50, donorY, 495, 135, 5).fillAndStroke(cBeige, cBrown);
            
            // Section Header
            doc.circle(75, donorY + 25, 12).fill(cDarkGreen);
            drawIcon(icons.user, 65, donorY + 15, 20, 'white');
            doc.fillColor(cTextBrown).font('Serif').fontSize(14).text('DONOR INFORMATION', 95, donorY + 20);
            doc.moveTo(50, donorY + 45).lineTo(545, donorY + 45).strokeColor(cBrown).lineWidth(0.5).stroke();

            // Fields
            const startY = donorY + 60;
            const labelX = 65;
            const colonX = 135;
            const valueX = 150;
            
            const drawField = (label, value, y) => {
                doc.fillColor(cTextBlack).font('Serif').fontSize(12).text(label, labelX, y);
                doc.text(':', colonX, y);
                // NotoSans 12pt requires a -4px offset to perfectly align with Times-Bold 12pt baseline
                renderMixedText(doc, value || '-', valueX, y, { fontSize: 12, yOffset: -4 });
                // Dotted line under value
                doc.save().moveTo(valueX, y + 18).lineTo(530, y + 18).dash(2, {space: 2}).strokeColor(cBrown).stroke().restore();
            };

            drawField('Name', donation.donorName, startY);
            drawField('Mobile', donation.mobile, startY + 25);
            drawField('Address', donation.address, startY + 50);

            // --- DONATION DETAILS BOX ---
            const detailsY = 430;
            doc.roundedRect(50, detailsY, 495, 160, 5).fillAndStroke(cBeige, cBrown);
            
            // Section Header
            doc.circle(75, detailsY + 25, 12).fill(cDarkGreen);
            drawIcon(icons.hands, 65, detailsY + 15, 20, 'white');
            doc.fillColor(cTextBrown).font('Serif').fontSize(14).text('DONATION DETAILS', 95, detailsY + 20);
            doc.moveTo(50, detailsY + 45).lineTo(545, detailsY + 45).strokeColor(cBrown).lineWidth(0.5).stroke();

            // Fields (Left side)
            const detailStartY = detailsY + 60;
            const detLabelX = 95;
            const detColonX = 195;
            const detValueX = 210;

            const drawDetailField = (icon, label, value, y, isGreen = false) => {
                drawIcon(icons[icon], 65, y - 2, 20, cDarkGreen);
                doc.fillColor(cTextBlack).font('Serif').fontSize(12).text(label, detLabelX, y);
                doc.text(':', detColonX, y);
                if (isGreen) {
                    doc.fillColor(cDarkGreen).font('Serif').text(value, detValueX, y);
                } else {
                    renderMixedText(doc, value || '-', detValueX, y, { fontSize: 12, yOffset: -4 });
                }
                if (!isGreen) {
                    // Dotted line under value
                    doc.save().moveTo(65, y + 18).lineTo(280, y + 18).dash(2, {space: 2}).strokeColor(cBrown).stroke().restore();
                }
            };

            drawDetailField('gift', 'Donation Type', donation.donationFor || 'General Fund', detailStartY);
            drawDetailField('payment', 'Payment Mode', donation.paymentMode, detailStartY + 40);
            drawDetailField('check', 'Payment Status', 'PAID', detailStartY + 80, true);

            // Amount Box (Right side)
            const amountBoxX = 295;
            const amountBoxY = detailsY + 55;
            doc.rect(amountBoxX, amountBoxY, 235, 105).fillAndStroke('#F8EFE4', cBrown);
            
            // Inner border
            doc.rect(amountBoxX + 5, amountBoxY + 5, 225, 95).strokeColor(cBrown).lineWidth(0.5).stroke();
            
            doc.fillColor(cTextBrown).font('Serif').fontSize(11).text('DONATION AMOUNT', amountBoxX, amountBoxY + 15, { width: 235, align: 'center' });
            
            // Arrows for DONATION AMOUNT
            doc.path(`M ${amountBoxX + 45} ${amountBoxY + 20} L ${amountBoxX + 35} ${amountBoxY + 20}`).strokeColor(cBrown).lineWidth(1).stroke();
            doc.path(`M ${amountBoxX + 190} ${amountBoxY + 20} L ${amountBoxX + 200} ${amountBoxY + 20}`).strokeColor(cBrown).lineWidth(1).stroke();

            const amountFormatted = donation.amount.toLocaleString('en-IN');
            // Shift NotoSans '₹' up by 12px to visually align with Serif 36pt amount
            const rupeeWidth = 25;
            const textWidth = doc.font('Serif').fontSize(36).widthOfString(amountFormatted);
            const totalWidth = rupeeWidth + textWidth;
            const startX = amountBoxX + (235 - totalWidth) / 2;
            
            doc.font('English').fontSize(36).fillColor(cDarkGreen).text('₹', startX, amountBoxY + 28);
            doc.font('Serif').fontSize(36).fillColor(cDarkGreen).text(amountFormatted, startX + rupeeWidth + 5, amountBoxY + 40);
            
            // Brown footer in Amount Box
            const amountInWords = numberToWords(donation.amount);
            doc.rect(amountBoxX + 5, amountBoxY + 75, 225, 25).fill(cTextBrown);
            doc.fillColor('white').font('English').fontSize(10).text(amountInWords, amountBoxX + 5, amountBoxY + 83, { width: 225, align: 'center' });

            // --- COLLECTED BY BOX ---
            const collectY = 600;
            doc.roundedRect(50, collectY, 495, 40, 5).fillAndStroke(cBeige, cBrown);
            drawIcon(icons.user, 65, collectY + 10, 20, cDarkGreen);
            doc.fillColor(cTextBlack).font('Serif').fontSize(12).text('Collected By', 95, collectY + 15);
            doc.text(':', 185, collectY + 15);
            renderMixedText(doc, donation.collectedBy || 'Admin', 210, collectY + 15, { fontSize: 12, yOffset: -4 });

            // --- FOOTER TEXT ---
            const footerY = 680;
            doc.moveTo(110, footerY + 10).lineTo(150, footerY + 10).strokeColor(cBrown).stroke();
            doc.moveTo(445, footerY + 10).lineTo(485, footerY + 10).strokeColor(cBrown).stroke();
            
            doc.fillColor(cDarkGreen).font('Italic').fontSize(16).text('Thank you for your valuable contribution.', 160, footerY);

            // Disclaimer Box
            const discY = 730;
            doc.rect(70, discY, 455, 30).fill('#F8EFE4');
            doc.fillColor(cTextBrown).font('English').fontSize(10).text('This is a computer generated receipt and does not require a physical signature.', 70, discY + 10, { width: 455, align: 'center' });

            // Finalize PDF file
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generatePdfReceipt };
