import { NextRequest, NextResponse } from 'next/server';
import { requireUser, verifyCsrfOrigin } from '@/lib/auth';
import { getUserLikedSongIds, toggleDbLike } from '@/lib/db';
import { z } from 'zod';

const likeSchema = z.object({
  songId: z.string().min(1, 'Mã bài hát không được để trống'),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireUser(req);
    if (authResult.errorResponse) {
      return NextResponse.json({ likedSongIds: [] });
    }
    const { user: payload } = authResult;

    const likedIds = await getUserLikedSongIds(payload.userId);
    return NextResponse.json({ likedSongIds: likedIds });
  } catch (error) {
    console.error('Likes GET error:', error);
    return NextResponse.json({ likedSongIds: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu JSON không hợp lệ.' },
        { status: 400 }
      );
    }

    const validation = likeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const result = await toggleDbLike(payload.userId, validation.data.songId);

    return NextResponse.json({
      success: true,
      liked: result.liked,
      message: result.liked ? 'Đã thêm vào mục yêu thích!' : 'Đã bỏ khỏi mục yêu thích.',
    });
  } catch (error) {
    console.error('Likes POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi máy chủ.' },
      { status: 500 }
    );
  }
}
