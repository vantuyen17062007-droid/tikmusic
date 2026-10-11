import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail, createDbSession, checkDbRateLimit, cleanExpiredSessions } from '@/lib/db';
import { verifyPassword, signSessionToken, getClientIp, verifyCsrfOrigin, SESSION_COOKIE_NAME } from '@/lib/auth';
import crypto from 'crypto';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    // CSRF protection: Kiểm tra header Origin cho yêu cầu POST
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do vi phạm bảo mật CSRF.' },
        { status: 403 }
      );
    }

    // Client IP for rate limiting
    const ip = getClientIp(req);
    const rateCheck = await checkDbRateLimit(`login_${ip}`, 5, 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ${rateCheck.retryAfterSec} giây.`,
        },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu yêu cầu không hợp lệ.' },
        { status: 400 }
      );
    }
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ',
        },
        { status: 400 }
      );
    }

    const { email, password, remember } = validation.data;
    const cleanEmail = email.trim().toLowerCase();

    // Look up user
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      // Don't disclose whether email exists
      return NextResponse.json(
        {
          success: false,
          message: 'Email hoặc mật khẩu không chính xác.',
        },
        { status: 401 }
      );
    }

    // Verify password hash
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email hoặc mật khẩu không chính xác.',
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signSessionToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      remember
    );

    // Store session in DB
    const maxAgeSeconds = remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();
    await createDbSession({
      id: `ses_${crypto.randomUUID()}`,
      userId: user.id,
      token,
      expiresAt,
    });

    // A7: Dọn các phiên hết hạn trong database
    await cleanExpiredSessions();

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công! Chào mừng bạn trở lại.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });

    // Set secure HttpOnly cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
