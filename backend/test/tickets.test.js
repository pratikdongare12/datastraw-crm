import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.dirname(path.dirname(fileURLToPath(
    import.meta.url)));
const baseUrl = 'http://localhost:4055/api';
let server;

async function waitForServer() {
    for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
            const response = await fetch(`${baseUrl}/health`);
            if (response.ok) return;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Test server did not start');
}

async function request(pathname, options = {}) {
    const response = await fetch(`${baseUrl}${pathname}`, options);
    const text = await response.text();
    return { response, body: text ? JSON.parse(text) : null };
}

before(async() => {
    server = spawn(process.execPath, ['index.js'], {
        cwd: backendDirectory,
        env: {...process.env, PORT: '4055' },
        stdio: 'ignore'
    });
    await waitForServer();
});

after(() => {
    if (server) server.kill();
});

test('ticket API validates input and supports the full lifecycle', async() => {
    const invalidBody = await request('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'null'
    });
    assert.equal(invalidBody.response.status, 400);

    const invalidEmail = await request('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'Test', customerEmail: 'invalid', subject: 'Invalid email' })
    });
    assert.equal(invalidEmail.response.status, 400);

    const invalidDescription = await request('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'Test', customerEmail: 'test@example.com', subject: 'Invalid description', description: 42 })
    });
    assert.equal(invalidDescription.response.status, 400);

    const created = await request('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'Lifecycle Test', customerEmail: `lifecycle-${Date.now()}@example.com`, subject: 'Lifecycle ticket', description: 'Test ticket' })
    });
    assert.equal(created.response.status, 201);
    assert.match(created.body.ticketId, /^TKT-\d+$/);

    const search = await request('/tickets?search=Lifecycle%20ticket');
    assert.equal(search.response.status, 200);
    assert.ok(search.body.some((ticket) => ticket.ticketId === created.body.ticketId));

    const updated = await request(`/tickets/${created.body.ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', notes: 'Resolution recorded' })
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.status, 'resolved');
    assert.ok(updated.body.notes.some((note) => note.noteText === 'Resolution recorded'));
    const auditNote = updated.body.notes.find((note) => note.noteText.startsWith('[System] Status changed from Open to Closed by Agent at '));
    assert.ok(auditNote);
    assert.match(auditNote.noteText, /by Agent at \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.$/);
    assert.equal(auditNote.createdAt, auditNote.noteText.slice(-20, -1));

    const missing = await request('/tickets/TKT-DOES-NOT-EXIST');
    assert.equal(missing.response.status, 404);

    const deleted = await request(`/tickets/${created.body.ticketId}`, { method: 'DELETE' });
    assert.equal(deleted.response.status, 204);

    const deletedTicket = await request(`/tickets/${created.body.ticketId}`);
    assert.equal(deletedTicket.response.status, 404);
});