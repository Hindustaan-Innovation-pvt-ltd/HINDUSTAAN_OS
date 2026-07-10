const mongoose = require('mongoose');

const docSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String, required: true }, // Markdown content
  category: { type: String, required: true },
  tags: [{ type: String }],
  roleVisibility: [{ type: String, enum: ['employee', 'manager', 'admin'] }],
  attachmentUrl: { type: String },
  createdBy: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Doc', docSchema);