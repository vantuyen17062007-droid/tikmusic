import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail, createUser, checkDbRateLimit } from '@/lib/db';
import { hashPassword, getClientIp, verifyCsrfOrigin } from '@/lib/auth';
import crypto from 'crypto';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
      .max(50, 'Tên hiển thị không được vượt quá 50 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(100, 'Mật khẩu không được quá 100 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export async function POST(req: NextRequest) {
  try {
    // A9: CSRF protection
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do vi phạm bảo mật CSRF.' },
        { status: 403 }
      );
    }

    // A2: Rate limiting cho Register (5 lần/giờ theo IP)
    const ip = getClientIp(req);
    const rateCheck = await checkDbRateLimit(`register_${ip}`, 5, 60 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Bạn đã thử đăng ký quá nhiều lần. Vui lòng thử lại sau ${rateCheck.retryAfterSec} giây.`,
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

    // Validate with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      return NextResponse.json(
        {
          success: false,
          message: firstError,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    const cleanEmail = email.trim().toLowerCase();

    // A3: Check if user already exists -> Trả thông báo chung để không lộ thông tin email
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Không thể tạo tài khoản với thông tin này, vui lòng thử email khác hoặc đăng nhập.',
        },
        { status: 400 }
      );
    }

    // Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);
    const userId = `usr_${crypto.randomUUID()}`;

    // Default colorful avatar placeholder
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      name
    )}&backgroundColor=8b5cf6,25f4ee`;

    // A4: Save into database with race-condition handling (UNIQUE constraint)
    let user;
    try {
      user = await createUser({
        id: userId,
        name,
        email: cleanEmail,
        passwordHash,
        avatarUrl,
      });
    } catch (insertError: unknown) {
      const errMsg = String(insertError);
      if (errMsg.includes('UNIQUE constraint failed') || errMsg.includes('SQLITE_CONSTRAINT')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Không thể tạo tài khoản với thông tin này, vui lòng thử email khác hoặc đăng nhập.',
          },
          { status: 400 }
        );
      }
      throw insertError;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Đăng ký tài khoản TikMusic thành công! Vui lòng đăng nhập.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
