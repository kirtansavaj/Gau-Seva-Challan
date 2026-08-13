const donationService = require('../services/donationService');
const pdfService = require('../services/pdfService');

exports.downloadPdf = async (req, res, next) => {
    try {
        const donation = await donationService.getDonationById(req.params.id);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Challan not found' });
        }
        
        const pdfBuffer = await pdfService.generatePdf(donation);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${donation.challanNo}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

exports.printPdf = async (req, res, next) => {
    try {
        const donation = await donationService.getDonationById(req.params.id);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Challan not found' });
        }
        
        const pdfBuffer = await pdfService.generatePdf(donation);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${donation.challanNo}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
