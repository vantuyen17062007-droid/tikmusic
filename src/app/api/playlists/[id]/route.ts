import { NextRequest, NextResponse } from 'next/server';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { deleteDbPlaylist } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu đăng nhập.' },
        { status: 401 }
      );
    }

    const payload = await validateSession(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập không hợp lệ.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await deleteDbPlaylist(id, payload.userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy danh sách phát hoặc bạn không có quyền xóa.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa danh sách phát thành công.',
    });
  } catch (error) {
    console.error('Playlist DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi xóa danh sách phát.' },
      { status: 500 }
    );
  }
}
