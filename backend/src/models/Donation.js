const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  challanNo: { type: String, required: true, unique: true, index: true },
  receiptDate: { type: Date, default: Date.now },
  donorName: { type: String, required: true },
  mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
  address: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  paymentMode: { type: String, required: true, enum: ['Cash', 'UPI', 'Cheque', 'Bank Transfer'] },
  donationFor: { type: String, default: 'General Fund' },
  collectedBy: { type: String, default: '' },
  remarks: { type: String },
  createdBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
