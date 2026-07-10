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