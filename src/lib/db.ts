import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

let clientInstance: Client | null = null;
let isSchemaInitialized = false;

export function getDatabase(): Client {
  if (clientInstance) return clientInstance;

  const cloudUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (cloudUrl && (cloudUrl.startsWith('libsql://') || cloudUrl.startsWith('https://'))) {
    // Remote Turso LibSQL Cloud Database (Production on Vercel)
    clientInstance = createClient({
      url: cloudUrl,
      authToken,
    });
  } else {
    // Local file-backed database (Development)
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Fallback for readonly serverless environments without cloud URL
      }
    }
    const dbPath = path.join(dataDir, 'tikmusic.db');
    clientInstance = createClient({
      url: `file:${dbPath.replace(/\\/g, '/')}`,
    });
  }

  return clientInstance;
}

export async function ensureSchema(): Promise<void> {
  if (isSchemaInitialized) return;
  const db = getDatabase();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  `);

  isSchemaInitialized = true;
}

// Database helper functions
export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
    args: [email.trim().toLowerCase()],
  });

  if (res.rows.length === 0) return undefined;
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password_hash: String(row.password_hash),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (res.rows.length === 0) return undefined;
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password_hash: String(row.password_hash),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createUser(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
}): Promise<UserRecord> {
  await ensureSchema();
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO users (id, name, email, password_hash, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      user.id,
      user.name.trim(),
      user.email.trim().toLowerCase(),
      user.passwordHash,
      user.avatarUrl || null,
      now,
      now,
    ],
  });

  return {
    id: user.id,
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    password_hash: user.passwordHash,
    avatar_url: user.avatarUrl || null,
    created_at: now,
    updated_at: now,
  };
}

export async function createDbSession(session: {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [session.id, session.userId, session.token, session.expiresAt, now],
  });
}

export async function deleteDbSession(token: string): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  await db.execute({
    sql: 'DELETE FROM sessions WHERE token = ?',
    args: [token],
  });
}

export async function getDbSession(token: string): Promise<SessionRecord | undefined> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'SELECT * FROM sessions WHERE token = ? AND expires_at > ? LIMIT 1',
    args: [token, new Date().toISOString()],
  });

  if (res.rows.length === 0) return undefined;
  const row = res.rows[0];
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    token: String(row.token),
    expires_at: String(row.expires_at),
    created_at: String(row.created_at),
  };
}

export async function updateUserProfile(id: string, name: string): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.execute({
    sql: 'UPDATE users SET name = ?, updated_at = ? WHERE id = ?',
    args: [name.trim(), now, id],
  });
}
