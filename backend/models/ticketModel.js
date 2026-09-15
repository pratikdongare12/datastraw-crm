import database from '../db.js';

const fields = `id, ticket_id AS ticketId, COALESCE(subject, title) AS subject,
    COALESCE(customer_name, customer) AS customerName, customer_email AS customerEmail,
    description, status, priority, created_at AS createdAt, updated_at AS updatedAt`;

export function listTickets({ status, search } = {}) {
    const conditions = [];
    const parameters = {};
    if (status) {
        conditions.push('status = @status');
        parameters.status = status;
    }
    if (search) {
        conditions.push(`(ticket_id LIKE @search OR customer_name LIKE @search OR customer_email LIKE @search
            OR subject LIKE @search OR title LIKE @search OR description LIKE @search)`);
        parameters.search = `%${search}%`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return database.prepare(`SELECT ${fields} FROM tickets ${where} ORDER BY updated_at DESC`).all(parameters);
}

export function findTicket(ticketId) {
    const ticket = database.prepare(`SELECT ${fields} FROM tickets WHERE ticket_id = ? OR id = ?`).get(ticketId, Number(ticketId));
    if (!ticket) return null;
    return {...ticket, notes: database.prepare('SELECT id, note_text AS noteText, created_at AS createdAt FROM notes WHERE ticket_id = ? ORDER BY created_at DESC').all(ticket.id) };
}

export function createTicket({ subject, title, description = '', status = 'open', priority = 'medium', customerName, customer, customerEmail = '' }) {
    const result = database.prepare(`
    INSERT INTO tickets (ticket_id, title, subject, description, status, priority, customer, customer_name, customer_email)
    VALUES (@ticketId, @subject, @subject, @description, @status, @priority, @customerName, @customerName, @customerEmail)
  `).run({ ticketId: `TKT-${String(nextTicketNumber()).padStart(3, '0')}`, subject: subject || title, description, status, priority, customerName: customerName || customer || '', customerEmail });
    return findTicket(result.lastInsertRowid);
}

function nextTicketNumber() {
    const row = database.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(ticket_id, 5) AS INTEGER)), 0) + 1 AS nextNumber FROM tickets").get();
    return row.nextNumber;
}

export function updateTicket(id, values) {
    const ticket = findTicket(id);
    if (!ticket) return null;

    const next = {
        subject: values.subject !== undefined ? values.subject : ticket.subject,
        description: values.description !== undefined ? values.description : ticket.description,
        status: values.status !== undefined ? values.status : ticket.status,
        priority: values.priority !== undefined ? values.priority : ticket.priority,
        customerName: values.customerName !== undefined ? values.customerName : ticket.customerName,
        customerEmail: values.customerEmail !== undefined ? values.customerEmail : ticket.customerEmail
    };
    database.prepare(`
    UPDATE tickets
    SET title = @subject, subject = @subject, description = @description, status = @status,
        priority = @priority, customer = @customerName, customer_name = @customerName,
        customer_email = @customerEmail, updated_at = CURRENT_TIMESTAMP
    WHERE ticket_id = @ticketId OR id = @ticketId
  `).run({...next, ticketId: id });
    return findTicket(id);
}

export function addNote(ticketId, noteText) {
    const ticket = database.prepare('SELECT id FROM tickets WHERE ticket_id = ? OR id = ?').get(ticketId, Number(ticketId));
    if (!ticket) return null;
    database.prepare('INSERT INTO notes (ticket_id, note_text) VALUES (?, ?)').run(ticket.id, noteText);
    return findTicket(ticketId);
}

export function deleteTicket(ticketId) {
    return database.prepare('DELETE FROM tickets WHERE ticket_id = ? OR id = ?').run(ticketId, Number(ticketId)).changes > 0;
}