const ticketModel = require('../models/supportTicketModel');
const ngoModel = require('../models/ngoModel');

async function fileTicket(req, res, next) {
	try {
		const { category, subject, description } = req.body;
		if (!subject || !description) {
			return res.status(400).json({ message: 'Subject and description are required.' });
		}

		const ngoProfile = await ngoModel.findByUserId(req.user.id);
		const ngoId    = ngoProfile ? ngoProfile.id : req.user.id;
		const ngoName  = ngoProfile ? ngoProfile.name : (req.user.firstName + ' ' + req.user.lastName).trim();
		const ngoEmail = ngoProfile?.email || req.user.email || '';

		const ticket = await ticketModel.createTicket({ ngoId, ngoName, ngoEmail, category, subject, description });
		res.status(201).json({ ticket });
	} catch (err) {
		next(err);
	}
}

async function getMyTickets(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const ngoProfile = await ngoModel.findByUserId(req.user.id);
		const ngoId = ngoProfile ? ngoProfile.id : req.user.id;
		const tickets = await ticketModel.getTicketsByNgo(ngoId, { limit, offset });
		res.json({ tickets });
	} catch (err) {
		next(err);
	}
}

async function getAllTickets(req, res, next) {
	try {
		const { status, limit = 100, offset = 0 } = req.query;
		const tickets = await ticketModel.getAllTickets({ status, limit, offset });
		res.json({ tickets });
	} catch (err) {
		next(err);
	}
}

async function updateTicket(req, res, next) {
	try {
		const { id } = req.params;
		const { status, adminReply } = req.body;
		const ticket = await ticketModel.updateTicket(id, { status, adminReply });
		if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
		res.json({ ticket });
	} catch (err) {
		next(err);
	}
}

module.exports = { fileTicket, getMyTickets, getAllTickets, updateTicket };