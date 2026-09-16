import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));
const databasePath = process.env.DB_PATH || path.join(__dirname, 'tickets.db');
const database = new Database(databasePath);

database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
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
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at DESC);
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    tier TEXT NOT NULL DEFAULT 'standard' CHECK(tier IN ('standard', 'priority', 'enterprise')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'refunded')),
    ordered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Support specialist',
    status TEXT NOT NULL DEFAULT 'online' CHECK(status IN ('online', 'away', 'offline')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
    kind TEXT NOT NULL DEFAULT 'update',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const teamCount = database.prepare('SELECT COUNT(*) AS count FROM team_members').get().count;
if (teamCount === 0) {
    database.prepare(`INSERT INTO team_members (name, email, role, status) VALUES
    ('Avery Morgan', 'avery@datastraw.example', 'Support lead', 'online'),
    ('Jordan Lee', 'jordan@datastraw.example', 'Customer specialist', 'online'),
    ('Sam Rivera', 'sam@datastraw.example', 'Operations', 'away')`).run();
}

export default database;