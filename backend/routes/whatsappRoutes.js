const express = require('express');
const router = express.Router();
const { handleWhatsAppWebhook } = require('../controllers/whatsappController');

// POST /api/whatsapp/webhook
router.post('/webhook', handleWhatsAppWebhook);

module.exports = router;
