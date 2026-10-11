import { NextRequest, NextResponse } from 'next/server';
import { deleteDbSession } from '@/lib/db';
import { SESSION_COOKIE_NAME, verifyCsrfOrigin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do vi phạm bảo mật CSRF.' },
        { status: 403 }
      );
    }

    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await deleteDbSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Đăng xuất thành công!',
    });

    // Clear session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi khi đăng xuất.',
      },
      { status: 500 }
    );
  }
}
