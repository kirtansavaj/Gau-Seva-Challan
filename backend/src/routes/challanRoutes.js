const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, challanController.createChallan);
router.get('/', protect, challanController.getChallans);
router.get('/search', protect, challanController.searchChallans);
router.get('/:id', protect, challanController.getChallanById);
router.delete('/:id', protect, challanController.deleteChallan);

module.exports = router;
