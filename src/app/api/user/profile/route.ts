import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUserProfile } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(50),
});

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Yêu cầu đăng nhập để truy cập tài nguyên này.' },
      { status: 401 }
    );
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Phiên đăng nhập đã hết hạn.' },
      { status: 401 }
    );
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Người dùng không tồn tại.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Yêu cầu đăng nhập.' },
      { status: 401 }
    );
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Phiên đăng nhập không hợp lệ.' },
      { status: 401 }
    );
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Người dùng không tồn tại.' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const validation = updateProfileSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: validation.error.issues[0]?.message },
      { status: 400 }
    );
  }

  await updateUserProfile(user.id, validation.data.name);

  return NextResponse.json({
    success: true,
    message: 'Cập nhật thông tin thành công!',
    user: {
      id: user.id,
      name: validation.data.name.trim(),
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    },
  });
}
