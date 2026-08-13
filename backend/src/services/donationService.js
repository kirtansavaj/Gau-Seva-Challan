const Counter = require('../models/Counter');
const Donation = require('../models/Donation');

const generateChallanNo = async () => {
    const currentYear = new Date().getFullYear();
    const doc = await Counter.findByIdAndUpdate(
        { _id: `challanId_${currentYear}` },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true }
    );
    
    // Format: GS-YYYY-XXXXXX
    const seqPadded = String(doc.seq).padStart(6, '0');
    return `GS-${currentYear}-${seqPadded}`;
};

const createDonation = async (donationData) => {
    // 1. Generate sequential challan number atomically
    const challanNo = await generateChallanNo();
    
    // 2. Save donation in MongoDB
    let donation = new Donation({
        ...donationData,
        challanNo
    });
    await donation.save();

    return donation;
};

const getDonations = async (query = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const donations = await Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    const total = await Donation.countDocuments(query);
    
    return {
        donations,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
    };
};

const getDonationById = async (id) => {
    return await Donation.findById(id);
};

const deleteDonation = async (id) => {
    return await Donation.findByIdAndDelete(id);
};

module.exports = {
    createDonation,
    getDonations,
    getDonationById,
    deleteDonation
};
