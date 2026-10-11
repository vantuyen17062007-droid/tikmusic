import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SONGS } from '@/data/mockData';

const ALLOWED_TIKTOK_HOSTS = [
  'tiktok.com',
  'www.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
  'm.tiktok.com',
];

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu yêu cầu không hợp lệ.' },
        { status: 400 }
      );
    }

    const { url } = body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp đường dẫn video TikTok.' },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();

    // 1. Kiểm tra cú pháp URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(cleanUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Đường dẫn không hợp lệ. Vui lòng nhập link đầy đủ (ví dụ: https://www.tiktok.com/@user/video/...)',
        },
        { status: 400 }
      );
    }

    // 2. Xác thực domain TikTok
    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowedHost = ALLOWED_TIKTOK_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );

    if (!isAllowedHost) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chỉ chấp nhận đường dẫn từ nền tảng TikTok (tiktok.com, vt.tiktok.com, vm.tiktok.com).',
        },
        { status: 400 }
      );
    }

    // 3. Kiểm tra danh mục bài hát mẫu đã liên kết trong dự án
    const matchingSample = MOCK_SONGS.find((s) => {
      if (cleanUrl.includes('rhyder') && s.id === 'song-1') return true;
      if (cleanUrl.includes('hieuthuhai') && s.id === 'song-2') return true;
      if (cleanUrl.includes('sontung') && s.id === 'song-3') return true;
      return false;
    });

    if (matchingSample) {
      return NextResponse.json({
        success: true,
        verified: true,
        isDemoCatalog: true,
        audioAvailable: true,
        data: {
          id: matchingSample.id,
          title: matchingSample.title,
          artist: matchingSample.artist,
          duration: matchingSample.duration,
          durationSec: matchingSample.durationSec,
          coverUrl: matchingSample.coverUrl,
          audioUrl: matchingSample.audioUrl,
          fileSize128: matchingSample.fileSize128,
          fileSize192: matchingSample.fileSize192,
          fileSize320: matchingSample.fileSize320,
        },
      });
    }

    // 4. Gọi API TikTok oEmbed chính thức để lấy thông tin video thực tế
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
      const oembedRes = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'TikMusic-Bot/1.0',
        },
        next: { revalidate: 3600 },
      });

      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        return NextResponse.json({
          success: true,
          verified: true,
          isDemoCatalog: false,
          audioAvailable: false,
          data: {
            title: oembedData.title || 'Video TikTok',
            artist: oembedData.author_name || 'TikTok Creator',
            authorUrl: oembedData.author_url,
            coverUrl: oembedData.thumbnail_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
            duration: '0:30',
            audioUrl: null,
          },
          message:
            'Đã tìm thấy video từ TikTok! Tuy nhiên, việc trích xuất âm thanh trực tiếp yêu cầu TikTok Audio Developer API có bản quyền. ' +
            'Hiện tại bạn có thể nghe và tải các bài hát mẫu trong kho nhạc của hệ thống.',
        });
      }
    } catch (err) {
      console.warn('TikTok oEmbed error:', err);
    }

    // Nếu không tìm thấy video qua oEmbed
    return NextResponse.json(
      {
        success: false,
        message: 'Không tìm thấy video TikTok hoặc video đang ở chế độ riêng tư/bị giới hạn khu vực.',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('TikTok info API error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi máy chủ khi xử lý link TikTok.' },
      { status: 500 }
    );
  }
}
