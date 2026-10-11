import { NextRequest, NextResponse } from 'next/server';
import { requireUser, verifyCsrfOrigin } from '@/lib/auth';
import { addSongToDbPlaylist, getDbPlaylistSongs, removeSongFromDbPlaylist } from '@/lib/db';
import { z } from 'zod';

const addSongSchema = z.object({
  song_id: z.string().min(1, 'Mã bài hát không được để trống'),
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  artist: z.string().min(1, 'Nghệ sĩ không được để trống'),
  duration: z.string().optional().default('3:00'),
  cover_url: z.string().optional().default('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500'),
  audio_url: z.string().optional().default(''),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songs = await getDbPlaylistSongs(id);
    return NextResponse.json({ success: true, songs });
  } catch (error) {
    console.error('Playlist songs GET error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

export async function POST(
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
    const { user } = authResult;
    const { id: playlistId } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu JSON không hợp lệ.' },
        { status: 400 }
      );
    }

    const validation = addSongSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { song_id, title, artist, duration, cover_url, audio_url } = validation.data;

    const result = await addSongToDbPlaylist(playlistId, user.userId, {
      songId: song_id,
      title,
      artist,
      duration: duration || '3:00',
      coverUrl: cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500',
      audioUrl: audio_url || '',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.message.includes('quyền') ? 403 : 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: result.message, song: result.song },
      { status: 201 }
    );
  } catch (error) {
    console.error('Playlist songs POST error:', error);
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
    const { user } = authResult;
    const { id: playlistId } = await params;

    let songId = req.nextUrl.searchParams.get('songId');
    if (!songId) {
      try {
        const body = await req.json();
        songId = body.songId || body.song_id;
      } catch {
        // no body
      }
    }

    if (!songId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã bài hát cần xóa.' },
        { status: 400 }
      );
    }

    const result = await removeSongFromDbPlaylist(playlistId, songId, user.userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.message.includes('quyền') ? 403 : 400 }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Playlist songs DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi máy chủ.' },
      { status: 500 }
    );
  }
}
