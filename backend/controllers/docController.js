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