import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUserProfile } from '@/lib/db';
import { requireUser, verifyCsrfOrigin } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
    .max(50, 'Tên hiển thị không được vượt quá 50 ký tự'),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireUser(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    const { user: payload } = authResult;

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
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi máy chủ.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do vi phạm bảo mật CSRF.' },
        { status: 403 }
      );
    }

    const authResult = await requireUser(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    const { user: payload } = authResult;

    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Người dùng không tồn tại.' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu JSON không hợp lệ.' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi cập nhật hồ sơ.' },
      { status: 500 }
    );
  }
}
