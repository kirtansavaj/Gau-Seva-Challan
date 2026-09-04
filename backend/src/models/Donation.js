const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  challanNo: { type: String, required: true, unique: true, index: true },
  receiptDate: { type: Date, default: Date.now },
  donorName: { type: String, required: true },
  mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
  address: { type: String, default: '' },
  amount: { type: Number, required: true, min: 1 },
  paymentMode: { type: String, required: true, enum: ['Cash', 'UPI', 'Cheque', 'Bank Transfer'] },
  donationFor: { type: String, required: true },
  collectedBy: { type: String, required: true },
  remarks: { type: String },
  createdBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
