const Joi = require('joi');

const createChallanSchema = Joi.object({
  donorName: Joi.string().min(3).required().messages({
    'string.empty': 'Donor Name is required',
    'string.min': 'Donor Name must be at least 3 characters long'
  }),
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'Mobile must be exactly 10 digits',
    'string.pattern.base': 'Mobile must contain only numbers'
  }),
  address: Joi.string().allow('', null),
  amount: Joi.number().positive().min(1).required(),
  paymentMode: Joi.string().valid('Cash', 'UPI', 'Cheque', 'Bank Transfer').required(),
  donationFor: Joi.string().required(),
  collectedBy: Joi.string().required(),
  remarks: Joi.string().allow('', null)
});

module.exports = {
  createChallanSchema
};
