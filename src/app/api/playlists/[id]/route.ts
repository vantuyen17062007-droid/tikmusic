import { NextRequest, NextResponse } from 'next/server';
import { requireUser, verifyCsrfOrigin } from '@/lib/auth';
import { deleteDbPlaylist, getDbPlaylistById, getDbPlaylistSongs } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlist = await getDbPlaylistById(id);
    if (!playlist) {
      return NextResponse.json(
        { success: false, message: 'Danh sách phát không tồn tại.' },
        { status: 404 }
      );
    }

    const songs = await getDbPlaylistSongs(id);
    return NextResponse.json({
      success: true,
      playlist: {
        ...playlist,
        songCount: songs.length,
        songs,
      },
    });
  } catch (error) {
    console.error('Playlist GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi máy chủ.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
