const express = require('express');
const router = express.Router();
const { createBug, getMyBugs, getBugById, updateBug, deleteBug } = require('../controllers/bugController');

router.post('/create', createBug);
router.get('/my', getMyBugs);
router.route('/:id').get(getBugById).put(updateBug).delete(deleteBug);

module.exports = router;