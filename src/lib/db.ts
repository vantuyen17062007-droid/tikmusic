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

export interface DbPlaylist {
  id: string;
  user_id: string;
  name: string;
  cover_url: string;
  created_at: string;
  updated_at: string;
}

export interface DbPlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  title: string;
  artist: string;
  duration: string;
  cover_url: string;
  audio_url: string;
  added_at: string;
}

let clientInstance: Client | null = null;
let isSchemaInitialized = false;

export function getDatabase(): Client {
  if (clientInstance) return clientInstance;

  const isProd = process.env.NODE_ENV === 'production';
  const cloudUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (isProd) {
    if (!cloudUrl) {
      throw new Error(
        'Lỗi cấu hình Database: Thiếu biến môi trường TURSO_DATABASE_URL (hoặc DATABASE_URL) trong môi trường production. ' +
        'Vui lòng cấu hình cơ sở dữ liệu Turso trên bảng điều khiển hosting.'
      );
    }
    if (cloudUrl.startsWith('libsql://') && !authToken) {
      throw new Error(
        'Lỗi cấu hình Database: Thiếu biến môi trường TURSO_AUTH_TOKEN cho cơ sở dữ liệu Turso trong môi trường production.'
      );
    }

    clientInstance = createClient({
      url: cloudUrl,
      authToken,
    });
  } else {
    // Development environment
    if (cloudUrl && (cloudUrl.startsWith('libsql://') || cloudUrl.startsWith('https://'))) {
      clientInstance = createClient({
        url: cloudUrl,
        authToken,
      });
    } else {
      // Local SQLite file
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch {
          // ignore
        }
      }
      const dbPath = path.join(dataDir, 'tikmusic.db');
      clientInstance = createClient({
        url: `file:${dbPath.replace(/\\/g, '/')}`,
      });
    }
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

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cover_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playlist_songs (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      duration TEXT NOT NULL,
      cover_url TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      added_at TEXT NOT NULL,
      FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_likes (
      user_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(user_id, song_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON user_likes(user_id);
  `);

  isSchemaInitialized = true;
}

// User methods
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

export async function updateUserProfile(id: string, name: string): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.execute({
    sql: 'UPDATE users SET name = ?, updated_at = ? WHERE id = ?',
    args: [name.trim(), now, id],
  });
}

// Session methods
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

// Playlist methods
export async function getUserPlaylists(userId: string): Promise<(DbPlaylist & { songCount: number })[]> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: `
      SELECT p.*, COUNT(ps.id) as songCount
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `,
    args: [userId],
  });

  return res.rows.map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    cover_url: String(row.cover_url),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    songCount: Number(row.songCount || 0),
  }));
}

export async function createDbPlaylist(playlist: {
  id: string;
  userId: string;
  name: string;
  coverUrl: string;
}): Promise<DbPlaylist> {
  await ensureSchema();
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO playlists (id, user_id, name, cover_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [playlist.id, playlist.userId, playlist.name.trim(), playlist.coverUrl, now, now],
  });

  return {
    id: playlist.id,
    user_id: playlist.userId,
    name: playlist.name.trim(),
    cover_url: playlist.coverUrl,
    created_at: now,
    updated_at: now,
  };
}

export async function deleteDbPlaylist(playlistId: string, userId: string): Promise<boolean> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'DELETE FROM playlists WHERE id = ? AND user_id = ?',
    args: [playlistId, userId],
  });
  return res.rowsAffected > 0;
}

// User Likes methods
export async function getUserLikedSongIds(userId: string): Promise<string[]> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'SELECT song_id FROM user_likes WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });
  return res.rows.map((row) => String(row.song_id));
}

export async function toggleDbLike(userId: string, songId: string): Promise<{ liked: boolean }> {
  await ensureSchema();
  const db = getDatabase();
  const existing = await db.execute({
    sql: 'SELECT song_id FROM user_likes WHERE user_id = ? AND song_id = ? LIMIT 1',
    args: [userId, songId],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: 'DELETE FROM user_likes WHERE user_id = ? AND song_id = ?',
      args: [userId, songId],
    });
    return { liked: false };
  } else {
    const now = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO user_likes (user_id, song_id, created_at) VALUES (?, ?, ?)',
      args: [userId, songId, now],
    });
    return { liked: true };
  }
}
