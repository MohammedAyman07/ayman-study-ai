/**
 * AYMAN STUDY AI - Database & Credit Management Engine
 * Supports MySQL (Hostinger Remote MySQL, TiDB, PlanetScale, Aiven, Railway)
 * with robust in-memory fallback to guarantee credit deduction even before DB is configured.
 */

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let tablesInitialized = false;

// Fallback in-memory credit store for demo/guest and when remote DB is offline
const memoryStore = new Map<string, { id: string; name: string; email: string; credits: number; picture: string }>();

export function getDbPool(): mysql.Pool | null {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL;
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASS || process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT) || 3306;

  try {
    if (dbUrl) {
      pool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
      });
      return pool;
    }

    if (host && user && database) {
      pool = mysql.createPool({
        host,
        port,
        user,
        password: password || '',
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      });
      return pool;
    }
  } catch (err: any) {
    console.error('Failed to initialize MySQL pool:', err?.message);
  }

  return null;
}

export async function initDbTables(): Promise<void> {
  if (tablesInitialized) return;
  const p = getDbPool();
  if (!p) return;

  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        google_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        picture VARCHAR(255) DEFAULT NULL,
        credits INT NOT NULL DEFAULT 20,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        razorpay_order_id VARCHAR(255) NOT NULL,
        razorpay_payment_id VARCHAR(255) DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL,
        credits_added INT NOT NULL,
        status ENUM('created','paid','failed') DEFAULT 'created',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    tablesInitialized = true;
  } catch (err: any) {
    console.warn('Could not auto-create database tables (check DB permissions):', err?.message);
  }
}

export interface UserRecord {
  id: string | number;
  google_id?: string;
  name: string;
  email: string;
  picture?: string;
  credits: number;
}

/**
 * Find or create user on authentication
 */
export async function findOrCreateUser(
  googleId: string,
  email: string,
  name: string,
  picture = ''
): Promise<UserRecord> {
  const p = getDbPool();

  if (p) {
    try {
      await initDbTables();
      const [rows]: any = await p.query('SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1', [
        googleId,
        email,
      ]);

      if (rows && rows.length > 0) {
        const u = rows[0];
        return {
          id: u.id,
          google_id: u.google_id,
          name: u.name,
          email: u.email,
          picture: u.picture,
          credits: Number(u.credits),
        };
      }

      // New user gets 20 free initial credits
      const [insertRes]: any = await p.query(
        'INSERT INTO users (google_id, email, name, picture, credits) VALUES (?, ?, ?, ?, 20)',
        [googleId, email, name, picture]
      );

      return {
        id: insertRes.insertId,
        google_id: googleId,
        name,
        email,
        picture,
        credits: 20,
      };
    } catch (err: any) {
      console.error('Database findOrCreateUser error, falling back to memory:', err?.message);
    }
  }

  // In-memory fallback
  const key = email || googleId;
  const existing = memoryStore.get(key);
  if (existing) {
    return existing;
  }

  const newUser: UserRecord = {
    id: 'user_' + Date.now(),
    google_id: googleId,
    name,
    email,
    picture,
    credits: 20,
  };
  memoryStore.set(key, newUser as any);
  return newUser;
}

/**
 * Deduct 1 credit for an AI operation.
 * Returns { success: true, remaining_credits: number } or { success: false, reason: 'INSUFFICIENT_CREDITS' }
 */
export async function deductCredit(
  userId: string | number,
  userEmail?: string
): Promise<{ success: boolean; reason?: string; remaining_credits: number }> {
  const p = getDbPool();

  if (p) {
    try {
      // Find current user credits
      const [rows]: any = await p.query(
        'SELECT id, credits FROM users WHERE id = ? OR email = ? LIMIT 1',
        [userId, userEmail || '']
      );

      if (rows && rows.length > 0) {
        const currentCredits = Number(rows[0].credits);
        if (currentCredits <= 0) {
          return { success: false, reason: 'INSUFFICIENT_CREDITS', remaining_credits: 0 };
        }

        const newCredits = currentCredits - 1;
        await p.query('UPDATE users SET credits = ? WHERE id = ?', [newCredits, rows[0].id]);
        return { success: true, remaining_credits: newCredits };
      }
    } catch (err: any) {
      console.error('Database deductCredit error, falling back to memory store:', err?.message);
    }
  }

  // Fallback in-memory deduction
  const key = String(userEmail || userId);
  let record = memoryStore.get(key);

  if (!record) {
    record = {
      id: String(userId),
      name: 'Student',
      email: userEmail || 'student@aymanstudy.ai',
      credits: 20,
      picture: '',
    };
    memoryStore.set(key, record);
  }

  if (record.credits <= 0) {
    return { success: false, reason: 'INSUFFICIENT_CREDITS', remaining_credits: 0 };
  }

  record.credits -= 1;
  memoryStore.set(key, record);
  return { success: true, remaining_credits: record.credits };
}

/**
 * Add credits after successful payment verification.
 */
export async function addCredits(
  userId: string | number,
  creditsToAdd: number,
  orderId?: string,
  paymentId?: string,
  amount = 99
): Promise<{ success: boolean; new_credits: number }> {
  const p = getDbPool();

  if (p) {
    try {
      await initDbTables();
      const [rows]: any = await p.query('SELECT id, credits FROM users WHERE id = ? LIMIT 1', [userId]);

      if (rows && rows.length > 0) {
        const newCredits = Number(rows[0].credits) + creditsToAdd;
        await p.query('UPDATE users SET credits = ? WHERE id = ?', [newCredits, rows[0].id]);

        if (orderId && paymentId) {
          await p.query(
            'INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, amount, credits_added, status) VALUES (?, ?, ?, ?, ?, "paid")',
            [rows[0].id, orderId, paymentId, amount, creditsToAdd]
          );
        }

        return { success: true, new_credits: newCredits };
      }
    } catch (err: any) {
      console.error('Database addCredits error:', err?.message);
    }
  }

  // Memory fallback
  const key = String(userId);
  let record = memoryStore.get(key);
  if (!record) {
    record = { id: key, name: 'Student', email: '', credits: 20, picture: '' };
  }
  record.credits += creditsToAdd;
  memoryStore.set(key, record);
  return { success: true, new_credits: record.credits };
}
