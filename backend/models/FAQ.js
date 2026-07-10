const mongoose = require('mongoose');

const faqSchema = mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  roleVisibility: [{ type: String, enum: ['employee', 'manager', 'admin'], default: ['employee', 'manager'] }]
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);