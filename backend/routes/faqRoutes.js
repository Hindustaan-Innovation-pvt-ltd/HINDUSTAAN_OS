const express = require('express');
const router = express.Router();
const { getFAQs, getFAQById, createFAQ, updateFAQ, deleteFAQ } = require('../controllers/faqController');

router.route('/').get(getFAQs).post(createFAQ);
router.route('/:id').get(getFAQById).put(updateFAQ).delete(deleteFAQ);

module.exports = router;