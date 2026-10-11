import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Xác thực toàn diện: chữ ký JWT + kiểm tra phiên trong DB
    const payload = await validateSession(token);
    if (!payload || !payload.userId) {
      const res = NextResponse.json({ user: null });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      const res = NextResponse.json({ user: null });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
