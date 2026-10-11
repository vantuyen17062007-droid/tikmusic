import { NextRequest, NextResponse } from 'next/server';
import { requireUser, verifyCsrfOrigin } from '@/lib/auth';
import { getUserPlaylists, createDbPlaylist } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

// A10: Bỏ coverUrl khỏi schema, luôn dùng ảnh mặc định từ server
const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên danh sách phát không được để trống')
    .max(100, 'Tên danh sách phát không được vượt quá 100 ký tự'),
});

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
];

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireUser(req);
    if (authResult.errorResponse) {
      return NextResponse.json({ playlists: [] });
    }
    const { user: payload } = authResult;

    const userPlaylists = await getUserPlaylists(payload.userId);
    return NextResponse.json({ playlists: userPlaylists });
  } catch (error) {
    console.error('Playlists GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi tải danh sách phát.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // A9: CSRF protection
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

    const validation = createPlaylistSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    // A10: Luôn chọn ảnh bìa mặc định từ danh sách cố định phía server
    const randomCover = DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)];

    const playlist = await createDbPlaylist({
      id: `pl_${crypto.randomUUID()}`,
      userId: payload.userId,
      name: validation.data.name,
      coverUrl: randomCover,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo danh sách phát thành công!',
        playlist: {
          ...playlist,
          songCount: 0,
          songs: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Playlists POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi tạo danh sách phát.' },
      { status: 500 }
    );
  }
}
