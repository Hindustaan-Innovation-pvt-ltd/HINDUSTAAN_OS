const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getTicketById, updateTicket, addComment, deleteTicket } = require('../controllers/ticketController');

router.post('/create', createTicket);
router.get('/my-tickets', getMyTickets);
router.post('/comment', addComment);
router.route('/:id').get(getTicketById).put(updateTicket).delete(deleteTicket);

module.exports = router;