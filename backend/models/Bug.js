const mongoose = require('mongoose');

const bugSchema = mongoose.Schema({
  reporterId: { type: String, required: true },
  reporterName: { type: String, required: true },
  role: { type: String, required: true },
  module: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  stepsToReproduce: { type: String },
  expectedBehavior: { type: String },
  actualBehavior: { type: String },
  screenshots: [{ type: String }],
  browser: { type: String },
  device: { type: String },
  status: { type: String, enum: ['Open', 'Investigating', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  assignedDeveloper: { type: String },
  comments: [{
    text: String,
    authorName: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Bug', bugSchema);