import { Router } from 'express';
import { addNote, createTicket, deleteTicket, findTicket, listTickets, updateTicket } from '../models/ticketModel.js';

const router = Router();
const statuses = new Set(['open', 'in_progress', 'resolved']);
const priorities = new Set(['low', 'medium', 'high']);
const normalizeStatus = (value) => ({ open: 'open', 'in progress': 'in_progress', in_progress: 'in_progress', closed: 'resolved', resolved: 'resolved' }[String(value).toLowerCase()] || value);

router.get('/', (request, response) => {
    const { search } = request.query;
    const status = request.query.status ? normalizeStatus(request.query.status) : '';
    if (status && !statuses.has(status)) return response.status(400).json({ error: 'Invalid status' });
    return response.json(listTickets({ status, search }));
});

router.get('/:id', (request, response) => {
    const ticket = findTicket(request.params.id);
    if (!ticket) return response.status(404).json({ error: 'Ticket not found' });
    return response.json(ticket);
});

router.post('/', (request, response) => {
    const { subject, title, description, priority, customerName, customer, customerEmail = '' } = request.body;
    const status = request.body.status ? normalizeStatus(request.body.status) : undefined;
    const ticketSubject = subject || title;
    if (typeof ticketSubject !== 'string' || !ticketSubject.trim()) return response.status(400).json({ error: 'Subject is required' });
    if (typeof(customerName || customer) !== 'string' || !(customerName || customer).trim()) return response.status(400).json({ error: 'Customer name is required' });
    if (typeof customerEmail !== 'string' || !customerEmail.includes('@')) return response.status(400).json({ error: 'Valid customer email is required' });
    if (status && !statuses.has(status)) return response.status(400).json({ error: 'Invalid status' });
    if (priority && !priorities.has(priority)) return response.status(400).json({ error: 'Invalid priority' });
    return response.status(201).json(createTicket({ subject: ticketSubject.trim(), description, status, priority, customerName: (customerName || customer).trim(), customerEmail: customerEmail.trim() }));
});

function updateHandler(request, response) {
    const { subject, title, priority, customerName, customerEmail, notes } = request.body;
    const status = request.body.status ? normalizeStatus(request.body.status) : undefined;
    const nextSubject = subject || title;
    if (nextSubject !== undefined && (typeof nextSubject !== 'string' || !nextSubject.trim())) return response.status(400).json({ error: 'Subject cannot be empty' });
    if (status !== undefined && !statuses.has(status)) return response.status(400).json({ error: 'Invalid status' });
    if (priority !== undefined && !priorities.has(priority)) return response.status(400).json({ error: 'Invalid priority' });
    if (customerEmail !== undefined && (!customerEmail.includes('@'))) return response.status(400).json({ error: 'Valid customer email is required' });
    if (notes !== undefined && (typeof notes !== 'string' || !notes.trim())) return response.status(400).json({ error: 'Note cannot be empty' });
    let ticket = updateTicket(request.params.id, {...request.body, status, subject: typeof nextSubject === 'string' ? nextSubject.trim() : nextSubject, customerName: typeof customerName === 'string' ? customerName.trim() : customerName, customerEmail: typeof customerEmail === 'string' ? customerEmail.trim() : customerEmail });
    if (!ticket) return response.status(404).json({ error: 'Ticket not found' });
    if (notes) ticket = addNote(request.params.id, notes.trim());
    return response.json(ticket);
}

router.put('/:id', updateHandler);
router.patch('/:id', updateHandler);

router.delete('/:id', (request, response) => {
    if (!deleteTicket(request.params.id)) return response.status(404).json({ error: 'Ticket not found' });
    return response.status(204).send();
});

export default router;