import database from '../db.js';

const customerFields = `id, name, email, company, phone, tier, created_at AS createdAt, updated_at AS updatedAt`;

export function listCustomers(search = '') {
    const filter = search ? 'WHERE name LIKE @search OR email LIKE @search OR company LIKE @search' : '';
    const parameters = search ? { search: `%${search}%` } : {};
    return database.prepare(`SELECT ${customerFields}, (SELECT COUNT(*) FROM tickets WHERE customer_email = customers.email) AS ticketCount FROM customers ${filter} ORDER BY updated_at DESC`).all(parameters);
}

export function createCustomer({ name, email, company = '', phone = '', tier = 'standard' }) {
    const result = database.prepare('INSERT INTO customers (name, email, company, phone, tier) VALUES (@name, @email, @company, @phone, @tier)').run({ name, email, company, phone, tier });
    return database.prepare(`SELECT ${customerFields} FROM customers WHERE id = ?`).get(result.lastInsertRowid);
}

export function listOrders(status = '') {
    const filter = status ? 'WHERE orders.status = @status' : '';
    return database.prepare(`SELECT orders.id, order_number AS orderNumber, customer_id AS customerId, customers.name AS customerName, customers.company, description, amount, orders.status, ordered_at AS orderedAt FROM orders JOIN customers ON customers.id = orders.customer_id ${filter} ORDER BY ordered_at DESC`).all(status ? { status } : {});
}

export function createOrder({ customerId, description, amount = 0, status = 'processing' }) {
    const number = `ORD-${String(nextOrderNumber()).padStart(4, '0')}`;
    const result = database.prepare('INSERT INTO orders (order_number, customer_id, description, amount, status) VALUES (?, ?, ?, ?, ?)').run(number, customerId, description, Number(amount), status);
    return database.prepare(`SELECT orders.id, order_number AS orderNumber, customer_id AS customerId, customers.name AS customerName, customers.company, description, amount, orders.status, ordered_at AS orderedAt FROM orders JOIN customers ON customers.id = orders.customer_id WHERE orders.id = ?`).get(result.lastInsertRowid);
}

function nextOrderNumber() {
    return database.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(order_number, 5) AS INTEGER)), 0) + 1 AS nextNumber FROM orders").get().nextNumber;
}

export function listTeam() {
    return database.prepare('SELECT id, name, email, role, status, created_at AS createdAt FROM team_members ORDER BY name').all();
}

export function createTeamMember({ name, email, role = 'Support specialist', status = 'online' }) {
    const result = database.prepare('INSERT INTO team_members (name, email, role, status) VALUES (?, ?, ?, ?)').run(name, email, role, status);
    return database.prepare('SELECT id, name, email, role, status, created_at AS createdAt FROM team_members WHERE id = ?').get(result.lastInsertRowid);
}

export function listActivities() {
    return database.prepare('SELECT activities.id, activities.kind, activities.message, activities.created_at AS createdAt, COALESCE(team_members.name, \'System\') AS memberName FROM activities LEFT JOIN team_members ON team_members.id = activities.member_id ORDER BY activities.created_at DESC LIMIT 20').all();
}

export function createActivity({ memberId = 1, kind = 'update', message }) {
    const result = database.prepare('INSERT INTO activities (member_id, kind, message) VALUES (?, ?, ?)').run(memberId, kind, message);
    return database.prepare('SELECT activities.id, activities.kind, activities.message, activities.created_at AS createdAt, COALESCE(team_members.name, \'System\') AS memberName FROM activities LEFT JOIN team_members ON team_members.id = activities.member_id WHERE activities.id = ?').get(result.lastInsertRowid);
}

export function getSummary() {
    return database.prepare(`
        SELECT
            (SELECT COUNT(*) FROM tickets) AS ticketCount,
            (SELECT COUNT(*) FROM tickets WHERE status = 'open') AS openTickets,
            (SELECT COUNT(*) FROM tickets WHERE status = 'in_progress') AS activeTickets,
            (SELECT COUNT(*) FROM tickets WHERE status = 'resolved') AS resolvedTickets,
            (SELECT COUNT(*) FROM customers) AS customerCount,
            (SELECT COUNT(*) FROM orders) AS orderCount,
            (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status != 'refunded') AS orderRevenue,
            (SELECT COUNT(*) FROM team_members WHERE status = 'online') AS onlineMembers
    `).get();
}