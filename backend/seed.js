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
      { title: 'Creating Projects', content: '# Creating Projects\n1. Go to Projects.\n2. Click New Project.', category: 'Projects', createdBy: 'Admin' },
      { title: 'Logging Hours', content: '# Logging Hours\nMake sure to fill out all fields.', category: 'Work Logs', createdBy: 'Admin' },
      { title: 'Managing Teams', content: '# Managing Teams\nOnly managers can do this.', category: 'Manager Dashboard', createdBy: 'Admin' }
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