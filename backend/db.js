import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));
const database = new Database(path.join(__dirname, 'tickets.db'));

database.pragma('journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE,
    title TEXT NOT NULL,
    subject TEXT,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    customer TEXT NOT NULL DEFAULT '',
    customer_name TEXT,
    customer_email TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const columns = database.prepare('PRAGMA table_info(tickets)').all().map((column) => column.name);
if (!columns.includes('ticket_id')) database.exec('ALTER TABLE tickets ADD COLUMN ticket_id TEXT');
if (!columns.includes('subject')) database.exec('ALTER TABLE tickets ADD COLUMN subject TEXT');
if (!columns.includes('customer_name')) database.exec('ALTER TABLE tickets ADD COLUMN customer_name TEXT');
if (!columns.includes('customer_email')) database.exec("ALTER TABLE tickets ADD COLUMN customer_email TEXT NOT NULL DEFAULT ''");
database.exec(`
  UPDATE tickets SET
    ticket_id = COALESCE(ticket_id, printf('TKT-%03d', id)),
    subject = COALESCE(subject, title),
    customer_name = COALESCE(customer_name, customer)
  WHERE ticket_id IS NULL OR subject IS NULL OR customer_name IS NULL
`);
database.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

export default database;