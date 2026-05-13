import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '../../badori.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedData();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      country TEXT NOT NULL CHECK(country IN ('RW', 'DJ')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_number TEXT UNIQUE NOT NULL,
      account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings')),
      currency TEXT NOT NULL CHECK(currency IN ('RWF', 'DJF')),
      balance REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_account_id TEXT REFERENCES accounts(id),
      to_account_id TEXT REFERENCES accounts(id),
      type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'transfer', 'exchange')),
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      converted_amount REAL,
      converted_currency TEXT,
      exchange_rate REAL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedData() {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM exchange_rates').get() as { cnt: number };
  if (existing.cnt > 0) return;

  // 1 RWF = 0.0644 DJF approximately (or 1 DJF = 15.53 RWF)
  db.prepare(`INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES (?, ?, ?)`).run('RWF', 'DJF', 0.0644);
  db.prepare(`INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES (?, ?, ?)`).run('DJF', 'RWF', 15.53);

  // Demo user for Rwanda
  const rwUserId = 'demo-rw-001';
  const djUserId = 'demo-dj-001';
  const passwordHash = bcrypt.hashSync('demo1234', 10);

  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(rwUserId);
  if (!userExists) {
    db.prepare(`INSERT INTO users (id, full_name, email, phone, password_hash, country) VALUES (?, ?, ?, ?, ?, ?)`).run(
      rwUserId, 'Amara Nkurunziza', 'amara@badori.rw', '+250788000001', passwordHash, 'RW'
    );
    db.prepare(`INSERT INTO accounts (id, user_id, account_number, account_type, currency, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'acc-rw-001', rwUserId, 'RW-0001-0001', 'checking', 'RWF', 250000
    );
    db.prepare(`INSERT INTO accounts (id, user_id, account_number, account_type, currency, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'acc-rw-002', rwUserId, 'RW-0001-0002', 'savings', 'RWF', 1500000
    );

    db.prepare(`INSERT INTO users (id, full_name, email, phone, password_hash, country) VALUES (?, ?, ?, ?, ?, ?)`).run(
      djUserId, 'Fadumo Hassan', 'fadumo@badori.dj', '+25377000001', passwordHash, 'DJ'
    );
    db.prepare(`INSERT INTO accounts (id, user_id, account_number, account_type, currency, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'acc-dj-001', djUserId, 'DJ-0001-0001', 'checking', 'DJF', 50000
    );
    db.prepare(`INSERT INTO accounts (id, user_id, account_number, account_type, currency, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'acc-dj-002', djUserId, 'DJ-0001-0002', 'savings', 'DJF', 200000
    );

    // Seed some transactions
    const txns = [
      ['tx-001', null, 'acc-rw-001', 'deposit', 100000, 'RWF', null, null, null, 'Initial deposit'],
      ['tx-002', 'acc-rw-001', 'acc-rw-002', 'transfer', 50000, 'RWF', null, null, null, 'Monthly savings'],
      ['tx-003', null, 'acc-dj-001', 'deposit', 30000, 'DJF', null, null, null, 'Initial deposit'],
    ];
    const txStmt = db.prepare(`INSERT INTO transactions (id, from_account_id, to_account_id, type, amount, currency, converted_amount, converted_currency, exchange_rate, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const tx of txns) txStmt.run(...tx);
  }
}
