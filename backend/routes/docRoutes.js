const express = require('express');
const router = express.Router();
const { getDocs, getDocById, createDoc, updateDoc, deleteDoc } = require('../controllers/docController');

router.route('/').get(getDocs).post(createDoc);
router.route('/:id').get(getDocById).put(updateDoc).delete(deleteDoc);

module.exports = router;