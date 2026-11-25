import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'warung_cloud.db');
const db = new sqlite3.Database(dbPath);

// Helper promisified database methods
export const query = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

export const run = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initDatabase = async (): Promise<void> => {
  await run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      transaction_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'CASH',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_trans_cust ON transactions(customer_id);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_cust_updated ON customers(updated_at);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_trans_updated ON transactions(updated_at);`);
  console.log('✅ Database initialized successfully at:', dbPath);
};

export default db;
