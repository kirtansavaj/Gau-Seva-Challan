const donationService = require('../services/donationService');
const { createChallanSchema } = require('../validators/challanValidator');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');

exports.createChallan = async (req, res, next) => {
    try {
        const { error } = createChallanSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const donation = await donationService.createDonation(req.body);
        logger.info(`Challan created: ${donation.challanNo}`);
        
        res.status(201).json({ success: true, data: donation });
    } catch (error) {
        logger.error(`Create Challan Error: ${error.message}`);
        next(error);
    }
};

exports.getChallans = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await donationService.getDonations({}, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.getChallanById = async (req, res, next) => {
    try {
        const donation = await donationService.getDonationById(req.params.id);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Challan not found' });
        }
        res.status(200).json({ success: true, data: donation });
    } catch (error) {
        next(error);
    }
};


exports.deleteChallan = async (req, res, next) => {
    try {
        const donation = await donationService.deleteDonation(req.params.id);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Challan not found' });
        }
        logger.info(`Challan deleted: ${donation.challanNo}`);
        res.status(200).json({ success: true, message: 'Challan deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.searchChallans = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: 'Search query required' });
        }

        const query = {
            $or: [
                { challanNo: { $regex: q, $options: 'i' } },
                { donorName: { $regex: q, $options: 'i' } },
                { mobile: { $regex: q, $options: 'i' } }
            ]
        };

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await donationService.getDonations(query, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
