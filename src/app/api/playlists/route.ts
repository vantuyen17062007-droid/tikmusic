import { NextRequest, NextResponse } from 'next/server';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getUserPlaylists, createDbPlaylist } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên danh sách phát không được để trống')
    .max(100, 'Tên danh sách phát không được vượt quá 100 ký tự'),
  coverUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ playlists: [] });
    }

    const payload = await validateSession(token);
    if (!payload) {
      return NextResponse.json({ playlists: [] });
    }

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
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập để tạo và lưu playlist trên tài khoản của bạn.' },
        { status: 401 }
      );
    }

    const payload = await validateSession(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
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

    const validation = createPlaylistSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const defaultCovers = [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    ];
    const randomCover = defaultCovers[Math.floor(Math.random() * defaultCovers.length)];

    const playlist = await createDbPlaylist({
      id: `pl_${crypto.randomUUID()}`,
      userId: payload.userId,
      name: validation.data.name,
      coverUrl: validation.data.coverUrl || randomCover,
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
