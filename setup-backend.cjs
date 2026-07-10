const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');

const dirs = [
  'config',
  'models',
  'controllers',
  'routes'
];

dirs.forEach(d => {
  const dirPath = path.join(backendDir, d);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const files = {
  'server.js': `
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/faqs', require('./routes/faqRoutes'));
app.use('/api/docs', require('./routes/docRoutes'));
app.use('/api/support', require('./routes/ticketRoutes'));
app.use('/api/bugs', require('./routes/bugRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`,
  'config/db.js': `
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/projectos', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
`,
  'models/FAQ.js': `
const mongoose = require('mongoose');

const faqSchema = mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  roleVisibility: [{ type: String, enum: ['employee', 'manager', 'admin'], default: ['employee', 'manager'] }]
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);
`,
  'models/Doc.js': `
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
`,
  'models/Ticket.js': `
const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  attachment: { type: String },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  assignedTo: { type: String },
  comments: [{
    text: String,
    authorName: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
`,
  'models/Bug.js': `
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
`,
  'controllers/faqController.js': `
const FAQ = require('../models/FAQ');

exports.getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.json(faqs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (faq) res.json(faq);
    else res.status(404).json({ message: 'FAQ not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createFAQ = async (req, res) => {
  try {
    const faq = new FAQ(req.body);
    const created = await faq.save();
    res.status(201).json(created);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (faq) res.json(faq);
    else res.status(404).json({ message: 'FAQ not found' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (faq) res.json({ message: 'FAQ removed' });
    else res.status(404).json({ message: 'FAQ not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
`,
  'controllers/docController.js': `
const Doc = require('../models/Doc');

exports.getDocs = async (req, res) => {
  try {
    const docs = await Doc.find();
    res.json(docs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getDocById = async (req, res) => {
  try {
    const doc = await Doc.findById(req.params.id);
    if (doc) res.json(doc);
    else res.status(404).json({ message: 'Doc not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createDoc = async (req, res) => {
  try {
    const doc = new Doc(req.body);
    const created = await doc.save();
    res.status(201).json(created);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.updateDoc = async (req, res) => {
  try {
    const doc = await Doc.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (doc) res.json(doc);
    else res.status(404).json({ message: 'Doc not found' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteDoc = async (req, res) => {
  try {
    const doc = await Doc.findByIdAndDelete(req.params.id);
    if (doc) res.json({ message: 'Doc removed' });
    else res.status(404).json({ message: 'Doc not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
`,
  'controllers/ticketController.js': `
const Ticket = require('../models/Ticket');

exports.createTicket = async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    const created = await ticket.save();
    res.status(201).json(created);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.getMyTickets = async (req, res) => {
  try {
    const { employeeId } = req.query; // in real app, from auth token
    const tickets = await Ticket.find({ employeeId });
    res.json(tickets);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket) res.json(ticket);
    else res.status(404).json({ message: 'Ticket not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (ticket) res.json(ticket);
    else res.status(404).json({ message: 'Ticket not found' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.addComment = async (req, res) => {
  try {
    const { ticketId, text, authorName } = req.body;
    const ticket = await Ticket.findById(ticketId);
    if (ticket) {
      ticket.comments.push({ text, authorName });
      await ticket.save();
      res.json(ticket);
    } else res.status(404).json({ message: 'Ticket not found' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (ticket) res.json({ message: 'Ticket removed' });
    else res.status(404).json({ message: 'Ticket not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
`,
  'controllers/bugController.js': `
const Bug = require('../models/Bug');

exports.createBug = async (req, res) => {
  try {
    const bug = new Bug(req.body);
    const created = await bug.save();
    res.status(201).json(created);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.getMyBugs = async (req, res) => {
  try {
    const { reporterId } = req.query; // in real app, from auth token
    const bugs = await Bug.find({ reporterId });
    res.json(bugs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getBugById = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (bug) res.json(bug);
    else res.status(404).json({ message: 'Bug not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateBug = async (req, res) => {
  try {
    const bug = await Bug.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (bug) res.json(bug);
    else res.status(404).json({ message: 'Bug not found' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findByIdAndDelete(req.params.id);
    if (bug) res.json({ message: 'Bug removed' });
    else res.status(404).json({ message: 'Bug not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
`,
  'routes/faqRoutes.js': `
const express = require('express');
const router = express.Router();
const { getFAQs, getFAQById, createFAQ, updateFAQ, deleteFAQ } = require('../controllers/faqController');

router.route('/').get(getFAQs).post(createFAQ);
router.route('/:id').get(getFAQById).put(updateFAQ).delete(deleteFAQ);

module.exports = router;
`,
  'routes/docRoutes.js': `
const express = require('express');
const router = express.Router();
const { getDocs, getDocById, createDoc, updateDoc, deleteDoc } = require('../controllers/docController');

router.route('/').get(getDocs).post(createDoc);
router.route('/:id').get(getDocById).put(updateDoc).delete(deleteDoc);

module.exports = router;
`,
  'routes/ticketRoutes.js': `
const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getTicketById, updateTicket, addComment, deleteTicket } = require('../controllers/ticketController');

router.post('/create', createTicket);
router.get('/my-tickets', getMyTickets);
router.post('/comment', addComment);
router.route('/:id').get(getTicketById).put(updateTicket).delete(deleteTicket);

module.exports = router;
`,
  'routes/bugRoutes.js': `
const express = require('express');
const router = express.Router();
const { createBug, getMyBugs, getBugById, updateBug, deleteBug } = require('../controllers/bugController');

router.post('/create', createBug);
router.get('/my', getMyBugs);
router.route('/:id').get(getBugById).put(updateBug).delete(deleteBug);

module.exports = router;
`,
  'seed.js': `
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const FAQ = require('./models/FAQ');
const Doc = require('./models/Doc');
const Ticket = require('./models/Ticket');
const Bug = require('./models/Bug');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await FAQ.deleteMany();
    await Doc.deleteMany();
    await Ticket.deleteMany();
    await Bug.deleteMany();

    const faqs = [
      { question: 'How do I submit daily work logs?', answer: 'Navigate to Work Logs -> Add Entry -> Select project and hours.', category: 'Work Logs' },
      { question: 'How do managers approve logs?', answer: 'Managers can review pending logs under Team Work Logs.', category: 'Manager Actions' },
      { question: 'How can I change my password?', answer: 'Go to Settings -> Account Security -> Change Password.', category: 'Security' }
    ];
    await FAQ.insertMany(faqs);

    const docs = [
      { title: 'Creating Projects', content: '# Creating Projects\\n1. Go to Projects.\\n2. Click New Project.', category: 'Projects', createdBy: 'Admin' },
      { title: 'Logging Hours', content: '# Logging Hours\\nMake sure to fill out all fields.', category: 'Work Logs', createdBy: 'Admin' },
      { title: 'Managing Teams', content: '# Managing Teams\\nOnly managers can do this.', category: 'Manager Dashboard', createdBy: 'Admin' }
    ];
    await Doc.insertMany(docs);

    const tickets = [
      { employeeId: 'u-1', employeeName: 'Amanda Smith', email: 'amanda@hindustaan.in', role: 'employee', category: 'Technical Issue', priority: 'High', subject: 'Unable to upload work logs', description: 'Receiving server error while submitting logs.', status: 'Open' },
      { employeeId: 'u-2', employeeName: 'Rahul Sharma', email: 'rahul@hindustaan.in', role: 'employee', category: 'Account Issue', priority: 'Medium', subject: 'Need access to Design project', description: 'Please grant me access.', status: 'In Progress' }
    ];
    await Ticket.insertMany(tickets);

    const bugs = [
      { reporterId: 'u-3', reporterName: 'Priya Patel', role: 'employee', module: 'Work Logs', severity: 'High', title: 'Crash on submit', description: 'The app crashes when I click submit without a project.', expectedBehavior: 'Validation error should show.', actualBehavior: 'App crashes.', status: 'Open' }
    ];
    await Bug.insertMany(bugs);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(backendDir, filepath), content.trim());
}

console.log('Backend boilerplate generated successfully!');
