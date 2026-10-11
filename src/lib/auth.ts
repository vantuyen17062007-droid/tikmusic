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

import { NextRequest, NextResponse } from 'next/server';

/**
 * Lấy IP khách hàng chuẩn xác từ headers:
 * 1. Ưu tiên x-real-ip do reverse proxy/hosting đặt.
 * 2. Lấy phần tử đầu tiên của chuỗi x-forwarded-for sau khi split dấu phẩy và trim.
 */
export function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded && forwarded.trim()) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  return '127.0.0.1';
}

/**
 * Kiểm tra CSRF cho các yêu cầu thay đổi dữ liệu (POST, PATCH, DELETE, PUT).
 * Kiểm tra header Origin có khớp với Host/X-Forwarded-Host của request hay không.
 */
export function verifyCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) {
    // Không có header origin (ví dụ server-to-server, script nội bộ)
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const cleanHost = host.split(':')[0].toLowerCase();
    const cleanOriginHost = originUrl.hostname.toLowerCase();
    return cleanHost === cleanOriginHost;
  } catch {
    return false;
  }
}

/**
 * Helper dùng chung để bảo vệ các route yêu cầu xác thực.
 * Trả về { user } nếu hợp lệ, hoặc { errorResponse } kèm mã 401.
 */
export async function requireUser(
  req: NextRequest
): Promise<{ user: SessionPayload; errorResponse?: never } | { user?: never; errorResponse: NextResponse }> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: 'Yêu cầu đăng nhập để truy cập tài nguyên này.' },
        { status: 401 }
      ),
    };
  }

  const payload = await validateSession(token);
  if (!payload || !payload.userId) {
    const res = NextResponse.json(
      { success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' },
      { status: 401 }
    );
    res.cookies.delete(SESSION_COOKIE_NAME);
    return { errorResponse: res };
  }

  return { user: payload };
}
