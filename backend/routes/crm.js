import { Router } from 'express';
import { createActivity, createCustomer, createOrder, createTeamMember, getSummary, listActivities, listCustomers, listOrders, listTeam } from '../models/crmModel.js';

const router = Router();
const tiers = new Set(['standard', 'priority', 'enterprise']);
const orderStatuses = new Set(['pending', 'processing', 'shipped', 'delivered', 'refunded']);
const memberStatuses = new Set(['online', 'away', 'offline']);

router.get('/summary', (_request, response) => response.json(getSummary()));

router.get('/customers', (request, response) => response.json(listCustomers(String(request.query.search || '').trim())));
router.post('/customers', (request, response) => {
    const { name, email, company, phone, tier = 'standard' } = request.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.includes('@')) return response.status(400).json({ error: 'Name and valid email are required' });
    if (!tiers.has(tier)) return response.status(400).json({ error: 'Invalid customer tier' });
    try { return response.status(201).json(createCustomer({ name: name.trim(), email: email.trim(), company: typeof company === 'string' ? company.trim() : '', phone: typeof phone === 'string' ? phone.trim() : '', tier })); } catch (error) { if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return response.status(409).json({ error: 'A customer with that email already exists' }); throw error; }
});

router.get('/orders', (request, response) => {
    const status = String(request.query.status || '');
    if (status && !orderStatuses.has(status)) return response.status(400).json({ error: 'Invalid order status' });
    return response.json(listOrders(status));
});
router.post('/orders', (request, response) => {
    const { customerId, description, amount, status = 'processing' } = request.body;
    if (!customerId || typeof description !== 'string' || !description.trim()) return response.status(400).json({ error: 'Customer and description are required' });
    if (!orderStatuses.has(status)) return response.status(400).json({ error: 'Invalid order status' });
    try { return response.status(201).json(createOrder({ customerId, description: description.trim(), amount, status })); } catch (error) { if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') return response.status(400).json({ error: 'Customer not found' }); throw error; }
});

router.get('/team', (_request, response) => response.json(listTeam()));
router.post('/team', (request, response) => {
    const { name, email, role = 'Support specialist', status = 'online' } = request.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.includes('@')) return response.status(400).json({ error: 'Name and valid email are required' });
    if (!memberStatuses.has(status)) return response.status(400).json({ error: 'Invalid team status' });
    try { return response.status(201).json(createTeamMember({ name: name.trim(), email: email.trim(), role: role.trim(), status })); } catch (error) { if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return response.status(409).json({ error: 'A team member with that email already exists' }); throw error; }
});

router.get('/activities', (_request, response) => response.json(listActivities()));
router.post('/activities', (request, response) => {
    const { memberId = 1, kind = 'update', message } = request.body;
    if (typeof message !== 'string' || !message.trim()) return response.status(400).json({ error: 'Activity message is required' });
    return response.status(201).json(createActivity({ memberId, kind, message: message.trim() }));
});

export default router;