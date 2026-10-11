import { NextRequest, NextResponse } from 'next/server';
import { requireUser, verifyCsrfOrigin } from '@/lib/auth';
import { getUserDownloadHistory, recordDbDownload } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const downloadRecordSchema = z.object({
  songId: z.string().min(1, 'Mã bài hát không được để trống'),
  songTitle: z.string().min(1, 'Tên bài hát không được để trống'),
  quality: z.string().min(1, 'Chất lượng không được để trống'),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireUser(req);
    if (authResult.errorResponse) {
      return NextResponse.json({ downloads: [] });
    }
    const { user } = authResult;

    const history = await getUserDownloadHistory(user.userId);
    return NextResponse.json({ downloads: history });
  } catch (error) {
    console.error('Downloads GET error:', error);
    return NextResponse.json({ downloads: [] }, { status: 500 });
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
      // Khách chưa đăng nhập không ghi vào DB, trả về thông báo chấp nhận
      return NextResponse.json({ success: true, saved: false, message: 'Khách chưa đăng nhập' });
    }
    const { user } = authResult;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Dữ liệu JSON không hợp lệ.' }, { status: 400 });
    }

    const validation = downloadRecordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    await recordDbDownload({
      id: `dl_${crypto.randomUUID()}`,
      userId: user.userId,
      songId: validation.data.songId,
      songTitle: validation.data.songTitle,
      quality: validation.data.quality,
    });

    return NextResponse.json({ success: true, saved: true, message: 'Đã lưu lịch sử tải.' });
  } catch (error) {
    console.error('Downloads POST error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi khi lưu lịch sử tải.' }, { status: 500 });
  }
}
