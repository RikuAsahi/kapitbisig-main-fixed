const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const controller = require('../controllers/supportTicketController');

const router = express.Router();

// NGO: file a ticket / view own tickets
router.post('/', auth, authorize.authorizeRoles(['ngo']), controller.fileTicket);
router.get('/my', auth, authorize.authorizeRoles(['ngo']), controller.getMyTickets);

// Admin: view all tickets / update status & reply
router.get('/', auth, authorize.authorizeRoles(['admin', 'superadmin']), controller.getAllTickets);
router.put('/:id', auth, authorize.authorizeRoles(['admin', 'superadmin']), controller.updateTicket);

module.exports = router;