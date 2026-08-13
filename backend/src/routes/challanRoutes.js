const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');
const pdfController = require('../controllers/pdfController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, challanController.createChallan);
router.get('/', protect, challanController.getChallans);
router.get('/search', protect, challanController.searchChallans);
router.get('/:id', protect, challanController.getChallanById);
router.get('/:id/pdf', protect, pdfController.downloadPdf);
router.get('/:id/print', protect, pdfController.printPdf);
router.delete('/:id', protect, challanController.deleteChallan);

module.exports = router;
