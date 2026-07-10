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