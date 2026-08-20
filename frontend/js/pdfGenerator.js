import { getAuthHeaders } from './auth.js';
import { numberToWords } from './utils.js';

async function fetchAsBase64(url) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

let pdfMakeReadyPromise = null;

// Ensure pdfmake and fonts are loaded (Cached so it only runs once)
function ensurePdfMake() {
    if (pdfMakeReadyPromise) return pdfMakeReadyPromise;

    pdfMakeReadyPromise = (async () => {
        try {
            if (!window.pdfMake) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error("Failed to load pdfmake script"));
                    document.head.appendChild(script);
                });
            }

            // Initialize VFS if empty
            if (!window.pdfMake.vfs) {
                window.pdfMake.vfs = {};
            }

            // Load Roboto (default for English) and Noto Serif Gujarati safely
            if (!window.pdfMake.vfs['Roboto-Regular.ttf']) {
                try {
                    const roboto = await fetchAsBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/fonts/Roboto/Roboto-Regular.ttf');
                    window.pdfMake.vfs['Roboto-Regular.ttf'] = roboto;
                } catch(e) { console.warn("Failed to fetch Roboto Regular font", e); }
                
                try {
                    const robotoMedium = await fetchAsBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/fonts/Roboto/Roboto-Medium.ttf');
                    window.pdfMake.vfs['Roboto-Medium.ttf'] = robotoMedium;
                } catch(e) { console.warn("Failed to fetch Roboto Medium font", e); }
                
                // Fetch Gujarati Font (Noto Serif Gujarati)
                try {
                    const gujarati = await fetchAsBase64('https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSerifGujarati/NotoSerifGujarati-Regular.ttf');
                    window.pdfMake.vfs['NotoGujarati-Regular.ttf'] = gujarati;

                    const gujaratiBold = await fetchAsBase64('https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSerifGujarati/NotoSerifGujarati-Bold.ttf');
                    window.pdfMake.vfs['NotoGujarati-Bold.ttf'] = gujaratiBold;
                } catch(e) {
                    console.warn("Failed to fetch Gujarati fonts", e);
                }

                window.pdfMake.fonts = {
                    Roboto: {
                        normal: 'Roboto-Regular.ttf',
                        bold: 'Roboto-Medium.ttf',
                        italics: 'Roboto-Regular.ttf',
                        bolditalics: 'Roboto-Medium.ttf'
                    },
                    Gujarati: {
                        normal: 'NotoGujarati-Regular.ttf',
                        bold: 'NotoGujarati-Bold.ttf',
                        italics: 'NotoGujarati-Regular.ttf',
                        bolditalics: 'NotoGujarati-Bold.ttf'
                    }
                };
            }
        } catch (err) {
            console.error("Critical error loading PDF generation resources:", err);
            throw err;
        }
    })();

    return pdfMakeReadyPromise;
}

export async function generateTruePdfBlob(data) {
    await ensurePdfMake();

    // Try to load logo
    let logoDataUrl = null;
    try {
        const logoBase64 = await fetchAsBase64(window.location.origin + '/images/logo.png');
        logoDataUrl = 'data:image/png;base64,' + logoBase64;
    } catch (e) {
        console.warn('Could not load logo image', e);
    }

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
            font: 'Roboto',
            color: '#1f2937' // gray-800
        },
        background: function() {
            // Top decorative accent line
            return {
                canvas: [
                    {
                        type: 'rect',
                        x: 40,
                        y: 40,
                        w: 515,
                        h: 6,
                        color: '#c2410c' // brand-500
                    }
                ]
            };
        },
        content: [
            // Header
            {
                columns: [
                    logoDataUrl ? { image: logoDataUrl, width: 80, margin: [0, 10, 0, 0] } : { text: '🐄', fontSize: 40, width: 80 },
                    {
                        stack: [
                            { text: 'OFFICIAL RECEIPT', fontSize: 10, bold: true, color: '#9a3412', alignment: 'right', margin: [0, 10, 0, 2] },
                            { text: 'RECEIPT NUMBER', fontSize: 8, color: '#6b7280', alignment: 'right' },
                            { text: data.challanNo, fontSize: 12, bold: true, alignment: 'right', margin: [0, 0, 0, 10] },
                            { text: 'VAISHNAV GAU SEVA PARIVAR', fontSize: 18, bold: true, color: '#111827', alignment: 'right' },
                            { text: 'Surat, Gujarat', fontSize: 11, color: '#9a3412', alignment: 'right' },
                            { text: 'Mo: 9825155382, 9979227675, 9924900147', fontSize: 10, color: '#6b7280', alignment: 'right' }
                        ],
                        width: '*'
                    }
                ],
                margin: [0, 15, 0, 20]
            },
            
            // Grid 1
            {
                table: {
                    widths: ['*', '*', '*'],
                    body: [
                        [
                            { text: 'DATE\n' + new Date(data.receiptDate).toLocaleDateString('en-IN'), style: 'gridCell', alignment: 'center' },
                            { text: 'PAYMENT MODE\n' + data.paymentMode, style: 'gridCell', alignment: 'center' },
                            { text: 'PURPOSE\n' + data.donationFor, style: 'gridCell', alignment: 'center' }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#e5e7eb',
                    vLineColor: () => '#e5e7eb',
                    paddingLeft: () => 10,
                    paddingRight: () => 10,
                    paddingTop: () => 10,
                    paddingBottom: () => 10
                },
                margin: [0, 0, 0, 15]
            },

            // Donor Info
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                stack: [
                                    { text: 'DONOR INFORMATION', fontSize: 9, bold: true, color: '#6b7280', margin: [0, 0, 0, 10] },
                                    {
                                        columns: [
                                            {
                                                stack: [
                                                    { text: 'DONOR NAME(S)', fontSize: 8, color: '#9ca3af' },
                                                    { text: data.donorName, fontSize: 12, bold: true }
                                                ]
                                            },
                                            {
                                                stack: [
                                                    { text: 'MOBILE NUMBER', fontSize: 8, color: '#9ca3af' },
                                                    { text: data.mobile, fontSize: 11, bold: true }
                                                ],
                                                width: 150
                                            }
                                        ],
                                        margin: [0, 0, 0, 15]
                                    },
                                    {
                                        stack: [
                                            { text: 'ADDRESS', fontSize: 8, color: '#9ca3af' },
                                            { text: data.address || '-', fontSize: 11 }
                                        ]
                                    }
                                ],
                                margin: [15, 15, 15, 15]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#e5e7eb',
                    vLineColor: () => '#e5e7eb'
                },
                margin: [0, 0, 0, 15]
            },
            
            // Amount
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                columns: [
                                    {
                                        stack: [
                                            { text: 'AMOUNT RECEIVED IN WORDS', fontSize: 9, bold: true, color: '#9a3412' },
                                            { text: 'Rupees ' + numberToWords(data.amount) + ' Only', fontSize: 12, italics: true, bold: true, color: '#431407' }
                                        ]
                                    },
                                    {
                                        stack: [
                                            { text: 'TOTAL AMOUNT', fontSize: 9, bold: true, color: '#9a3412', alignment: 'right' },
                                            { text: 'Rs ' + data.amount.toLocaleString('en-IN'), fontSize: 18, bold: true, color: '#9a3412', alignment: 'right' }
                                        ],
                                        width: 150
                                    }
                                ],
                                margin: [15, 15, 15, 15]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#fed7aa', // orange-200
                    vLineColor: () => '#fed7aa',
                    fillColor: () => '#fffcf5' // very light orange
                },
                margin: [0, 0, 0, 15]
            },

            // Remarks (if any)
            data.remarks ? {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                stack: [
                                    { text: 'REMARKS', fontSize: 9, bold: true, color: '#6b7280' },
                                    { text: data.remarks, fontSize: 11 }
                                ],
                                margin: [15, 10, 15, 10]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#e5e7eb',
                    vLineColor: () => '#e5e7eb'
                },
                margin: [0, 0, 0, 15]
            } : null,

            // Footer Quote
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                stack: [
                                    { text: 'રાધે રાધે — આપનો ગૌ સેવા સહયોગ વંદનીય છે.', font: window.pdfMake.vfs['NotoGujarati-Regular.ttf'] ? 'Gujarati' : 'Roboto', fontSize: 14, bold: true, color: '#9a3412', alignment: 'center', margin: [0, 0, 0, 5] },
                                    { text: 'Vaishnav Gau Seva Parivar - Dedicated to Noble Service', fontSize: 9, color: '#b45309', alignment: 'center' }
                                ],
                                margin: [15, 15, 15, 15]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#fde68a', // amber-200
                    vLineColor: () => '#fde68a',
                    fillColor: () => '#fffbeb' // amber-50
                },
                margin: [0, 10, 0, 30]
            },

            // Very Bottom Footer
            {
                columns: [
                    { text: 'This is a computer-generated receipt for donations\nreceived towards Gau Seva activities.', fontSize: 8, color: '#9ca3af' },
                    { 
                        stack: [
                            { text: (data.collectedBy || 'ADMIN').toUpperCase(), fontSize: 10, bold: true, color: '#111827' },
                            { text: 'COLLECTED BY', fontSize: 8, bold: true, color: '#6b7280' }
                        ], 
                        alignment: 'right' 
                    }
                ],
                absolutePosition: { x: 40, y: 770 }
            }
        ].filter(Boolean),
        
        styles: {
            gridCell: {
                fontSize: 9,
                color: '#6b7280',
                lineHeight: 1.4
            }
        }
    };

    return new Promise((resolve) => {
        const pdf = window.pdfMake.createPdf(docDefinition);
        pdf.getBlob((blob) => {
            resolve(blob);
        });
    });
}
