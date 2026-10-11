import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getDbSession } from './db';

export const SESSION_COOKIE_NAME = 'tikmusic_session';

/**
 * Lấy khóa bí mật JWT từ biến môi trường.
 * Bắt buộc phải có JWT_SECRET (tối thiểu 32 ký tự).
 * Tuyệt đối không dùng khóa dự phòng cố định trong production.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Lỗi cấu hình bảo mật nghiêm trọng: Biến môi trường JWT_SECRET bị thiếu trong môi trường production.'
      );
    }
    throw new Error(
      'Lỗi cấu hình: Vui lòng thiết lập biến môi trường JWT_SECRET trong file .env.local (tối thiểu 32 ký tự).'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      'Lỗi bảo mật: JWT_SECRET phải có độ dài tối thiểu 32 ký tự để đảm bảo an toàn thuật toán HS256.'
    );
  }

  return new TextEncoder().encode(secret);
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token Signing & Verification
export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

export async function signSessionToken(
  payload: SessionPayload,
  remember: boolean = true
): Promise<string> {
  const secret = getJwtSecret();
  const expiresIn = remember ? '30d' : '7d';

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Xác minh chữ ký JWT và thời hạn.
 * Chỉ chấp nhận thuật toán HS256.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.userId || !payload.email || !payload.name) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/**
 * Xác thực phiên toàn diện:
 * 1. Kiểm tra chữ ký và hạn dùng JWT
 * 2. Đối chiếu token với bản ghi phiên còn hiệu lực trong database
 * Nếu phiên đã bị đăng xuất ở server, từ chối ngay lập tức.
 */
export async function validateSession(token: string): Promise<SessionPayload | null> {
  if (!token) return null;

  // 1. Kiểm tra JWT
  const jwtPayload = await verifySessionToken(token);
  if (!jwtPayload) return null;

  // 2. Đối chiếu với bảng sessions trong database
  const dbSession = await getDbSession(token);
  if (!dbSession) {
    return null; // Token không tồn tại trong database (đã đăng xuất hoặc bị thu hồi)
  }

  if (dbSession.user_id !== jwtPayload.userId) {
    return null; // Mâu thuẫn thông tin user giữa token và DB
  }

  return jwtPayload;
}

// Rate Limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Rate Limiter theo IP cho các API nhạy cảm.
 * Lưu ý: Trong môi trường serverless đa instance, bộ nhớ này giới hạn theo từng container.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true };
}
