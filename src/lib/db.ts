import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS download_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      song_title TEXT NOT NULL,
      quality TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON user_likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
    CREATE INDEX IF NOT EXISTS idx_downloads_user ON download_history(user_id);
  `);

  // Migration: Dọn các session cũ chưa băm SHA-256 (JWT gốc dài > 64 ký tự hoặc chứa dấu '.')
  try {
    await db.execute(`DELETE FROM sessions WHERE INSTR(token, '.') > 0 OR LENGTH(token) != 64`);
  } catch {
    // Bỏ qua nếu bảng sessions mới tạo
  }

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

// Session methods (Tokens are hashed using SHA-256 before storing or querying)
export async function createDbSession(session: {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  const now = new Date().toISOString();
  const hashed = hashToken(session.token);

  await db.execute({
    sql: `
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [session.id, session.userId, hashed, session.expiresAt, now],
  });
}

export async function deleteDbSession(token: string): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  const hashed = hashToken(token);
  await db.execute({
    sql: 'DELETE FROM sessions WHERE token = ?',
    args: [hashed],
  });
}

export async function getDbSession(token: string): Promise<SessionRecord | undefined> {
  await ensureSchema();
  const db = getDatabase();
  const hashed = hashToken(token);
  const res = await db.execute({
    sql: 'SELECT * FROM sessions WHERE token = ? AND expires_at > ? LIMIT 1',
    args: [hashed, new Date().toISOString()],
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

export async function cleanExpiredSessions(): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  try {
    await db.execute({
      sql: 'DELETE FROM sessions WHERE expires_at < ?',
      args: [new Date().toISOString()],
    });
  } catch (err) {
    console.error('Error cleaning expired sessions:', err);
  }
}

// Rate limit methods (Stored in shared DB table rate_limits)
export async function checkDbRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  await ensureSchema();
  const db = getDatabase();
  const now = Date.now();

  // Dọn dẹp các bản ghi hết hạn
  try {
    await db.execute({
      sql: 'DELETE FROM rate_limits WHERE reset_at < ?',
      args: [now],
    });
  } catch {
    // Ignore cleanup errors
  }

  const existing = await db.execute({
    sql: 'SELECT count, reset_at FROM rate_limits WHERE key = ? LIMIT 1',
    args: [key],
  });

  if (existing.rows.length === 0) {
    const resetAt = now + windowMs;
    await db.execute({
      sql: 'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)',
      args: [key, resetAt],
    });
    return { allowed: true };
  }

  const row = existing.rows[0];
  const count = Number(row.count || 0);
  const resetAt = Number(row.reset_at || 0);

  if (now > resetAt) {
    const newResetAt = now + windowMs;
    await db.execute({
      sql: 'UPDATE rate_limits SET count = 1, reset_at = ? WHERE key = ?',
      args: [newResetAt, key],
    });
    return { allowed: true };
  }

  if (count >= maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  await db.execute({
    sql: 'UPDATE rate_limits SET count = count + 1 WHERE key = ?',
    args: [key],
  });

  return { allowed: true };
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

// Playlist Songs methods
export async function getDbPlaylistById(playlistId: string): Promise<DbPlaylist | undefined> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'SELECT * FROM playlists WHERE id = ? LIMIT 1',
    args: [playlistId],
  });

  if (res.rows.length === 0) return undefined;
  const row = res.rows[0];
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    cover_url: String(row.cover_url),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getDbPlaylistSongs(playlistId: string): Promise<DbPlaylistSong[]> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'SELECT * FROM playlist_songs WHERE playlist_id = ? ORDER BY added_at DESC',
    args: [playlistId],
  });

  return res.rows.map((row) => ({
    id: String(row.id),
    playlist_id: String(row.playlist_id),
    song_id: String(row.song_id),
    title: String(row.title),
    artist: String(row.artist),
    duration: String(row.duration),
    cover_url: String(row.cover_url),
    audio_url: String(row.audio_url),
    added_at: String(row.added_at),
  }));
}

export async function addSongToDbPlaylist(
  playlistId: string,
  userId: string,
  song: {
    songId: string;
    title: string;
    artist: string;
    duration: string;
    coverUrl: string;
    audioUrl: string;
  }
): Promise<{ success: boolean; message: string; song?: DbPlaylistSong }> {
  await ensureSchema();
  const db = getDatabase();

  // Kiểm tra quyền sở hữu playlist
  const playlist = await db.execute({
    sql: 'SELECT id, user_id FROM playlists WHERE id = ? LIMIT 1',
    args: [playlistId],
  });

  if (playlist.rows.length === 0) {
    return { success: false, message: 'Danh sách phát không tồn tại.' };
  }

  if (String(playlist.rows[0].user_id) !== userId) {
    return { success: false, message: 'Bạn không có quyền chỉnh sửa danh sách phát này.' };
  }

  // Chặn trùng bài hát trong playlist
  const existingSong = await db.execute({
    sql: 'SELECT id FROM playlist_songs WHERE playlist_id = ? AND song_id = ? LIMIT 1',
    args: [playlistId, song.songId],
  });

  if (existingSong.rows.length > 0) {
    return { success: false, message: 'Bài hát này đã có trong danh sách phát.' };
  }

  const id = `ps_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO playlist_songs (id, playlist_id, song_id, title, artist, duration, cover_url, audio_url, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      playlistId,
      song.songId,
      song.title.trim(),
      song.artist.trim(),
      song.duration,
      song.coverUrl,
      song.audioUrl,
      now,
    ],
  });

  // Cập nhật updated_at cho playlist
  await db.execute({
    sql: 'UPDATE playlists SET updated_at = ? WHERE id = ?',
    args: [now, playlistId],
  });

  return {
    success: true,
    message: 'Đã thêm bài hát vào danh sách phát!',
    song: {
      id,
      playlist_id: playlistId,
      song_id: song.songId,
      title: song.title.trim(),
      artist: song.artist.trim(),
      duration: song.duration,
      cover_url: song.coverUrl,
      audio_url: song.audioUrl,
      added_at: now,
    },
  };
}

export async function removeSongFromDbPlaylist(
  playlistId: string,
  songId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  await ensureSchema();
  const db = getDatabase();

  // Kiểm tra quyền sở hữu playlist
  const playlist = await db.execute({
    sql: 'SELECT id, user_id FROM playlists WHERE id = ? LIMIT 1',
    args: [playlistId],
  });

  if (playlist.rows.length === 0) {
    return { success: false, message: 'Danh sách phát không tồn tại.' };
  }

  if (String(playlist.rows[0].user_id) !== userId) {
    return { success: false, message: 'Bạn không có quyền xóa bài khỏi danh sách phát này.' };
  }

  const res = await db.execute({
    sql: 'DELETE FROM playlist_songs WHERE playlist_id = ? AND (song_id = ? OR id = ?)',
    args: [playlistId, songId, songId],
  });

  if (res.rowsAffected === 0) {
    return { success: false, message: 'Bài hát không có trong danh sách phát.' };
  }

  const now = new Date().toISOString();
  await db.execute({
    sql: 'UPDATE playlists SET updated_at = ? WHERE id = ?',
    args: [now, playlistId],
  });

  return { success: true, message: 'Đã xóa bài hát khỏi danh sách phát.' };
}

// Download History methods
export interface DownloadRecord {
  id: string;
  user_id: string;
  song_id: string;
  song_title: string;
  quality: string;
  created_at: string;
}

export async function recordDbDownload(download: {
  id: string;
  userId: string;
  songId: string;
  songTitle: string;
  quality: string;
}): Promise<void> {
  await ensureSchema();
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO download_history (id, user_id, song_id, song_title, quality, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [download.id, download.userId, download.songId, download.songTitle.trim(), download.quality, now],
  });
}

export async function getUserDownloadHistory(userId: string): Promise<DownloadRecord[]> {
  await ensureSchema();
  const db = getDatabase();
  const res = await db.execute({
    sql: 'SELECT * FROM download_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    args: [userId],
  });

  return res.rows.map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    song_id: String(row.song_id),
    song_title: String(row.song_title),
    quality: String(row.quality),
    created_at: String(row.created_at),
  }));
}

