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