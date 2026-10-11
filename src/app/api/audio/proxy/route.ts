import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_AUDIO_HOSTS = [
  'actions.google.com',
  'google.com',
  'www.google.com',
  'tiktokcdn.com',
  'byteoversea.com',
  'ibyteimg.com',
  'tiktok.com',
  'unsplash.com',
  'images.unsplash.com',
];

function isHostAllowed(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_AUDIO_HOSTS.some(
    (allowed) => lower === allowed || lower.endsWith(`.${allowed}`)
  );
}

export async function GET(req: NextRequest) {
  try {
    const urlParam = req.nextUrl.searchParams.get('url');
    const filename = req.nextUrl.searchParams.get('filename') || 'tikmusic-audio.mp3';

    if (!urlParam) {
      return NextResponse.json(
        { success: false, message: 'Thiếu tham số url âm thanh.' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlParam);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Đường dẫn url không hợp lệ.' },
        { status: 400 }
      );
    }

    // SSRF protection: Chỉ cho phép HTTP/HTTPS và các hostname nằm trong allowlist
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return NextResponse.json(
        { success: false, message: 'Giao thức không được hỗ trợ.' },
        { status: 400 }
      );
    }

    if (!isHostAllowed(parsedUrl.hostname)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nguồn âm thanh không nằm trong danh sách máy chủ được phép chuyển tiếp.',
        },
        { status: 403 }
      );
    }

    // Fetch stream từ upstream
    const upstreamRes = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Nguồn âm thanh không phản hồi hoặc bị chặn bản quyền (HTTP ${upstreamRes.status}).`,
        },
        { status: 502 }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || 'audio/mpeg';

    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi kết nối máy chủ khi chuyển tiếp âm thanh.',
      },
      { status: 500 }
    );
  }
}
