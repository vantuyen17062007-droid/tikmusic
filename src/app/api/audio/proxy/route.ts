import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/auth';
import { checkDbRateLimit } from '@/lib/db';

/**
 * Danh sách tên miền được phép proxy file âm thanh (Allowlist).
 * Chỉ chấp nhận actions.google.com (cho audio mẫu) và các CDN TikTok chính thức.
 * Tuyệt đối không cho phép domain gốc 'google.com' hay 'tiktok.com' để tránh open-relay.
 */
const ALLOWED_AUDIO_DOMAINS = [
  'actions.google.com',
  'tiktokcdn.com',
  'tiktokcdn-us.com',
  'byteoversea.com',
  'ibyteimg.com',
];

/**
 * Kiểm tra xem hostname có phải là IP literal hoặc địa chỉ nội bộ/localhost không.
 */
function isIpOrLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  // IPv4 literal: e.g. 127.0.0.1, 192.168.1.1
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(lower)) {
    return true;
  }
  // IPv6 literal: contains ':' or enclosed in []
  if (lower.includes(':') || lower.startsWith('[') || lower.endsWith(']')) {
    return true;
  }
  return false;
}

/**
 * Kiểm tra hostname có hợp lệ và nằm trong allowlist hay không.
 */
function isHostAllowed(hostname: string): boolean {
  if (isIpOrLocalhost(hostname)) {
    return false;
  }
  const lower = hostname.toLowerCase();
  return ALLOWED_AUDIO_DOMAINS.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`)
  );
}

export async function GET(req: NextRequest) {
  try {
    // 1. Rate limiting theo IP người dùng (60 requests / phút)
    const clientIp = getClientIp(req);
    const rateLimit = await checkDbRateLimit('rl:audio_proxy:' + clientIp, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Vượt quá giới hạn tải âm thanh. Vui lòng thử lại sau ${rateLimit.retryAfterSec || 60} giây.`,
        },
        { status: 429 }
      );
    }

    const urlParam = req.nextUrl.searchParams.get('url');
    let filename = req.nextUrl.searchParams.get('filename') || 'tikmusic-audio.mp3';

    // 2. Làm sạch và xác thực tham số filename
    filename = filename.replace(/[\r\n"';\\]/g, '').trim();
    if (filename.length > 150) {
      filename = filename.slice(0, 150);
    }
    if (!filename) {
      filename = 'tikmusic-audio.mp3';
    }

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

    // 3. Xử lý upstream fetch với timeout 15 giây và redirect thủ công tối đa 3 lần
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let currentUrl = parsedUrl;
    let redirectCount = 0;
    const MAX_REDIRECTS = 3;
    let upstreamRes: Response | null = null;

    try {
      while (redirectCount <= MAX_REDIRECTS) {
        // Kiểm tra protocol
        if (currentUrl.protocol !== 'https:' && currentUrl.protocol !== 'http:') {
          return NextResponse.json(
            { success: false, message: 'Giao thức không được hỗ trợ.' },
            { status: 403 }
          );
        }

        // Kiểm tra allowlist và chặn IP literal/localhost
        if (!isHostAllowed(currentUrl.hostname)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Nguồn âm thanh không nằm trong danh sách máy chủ được phép chuyển tiếp.',
            },
            { status: 403 }
          );
        }

        const response = await fetch(currentUrl.toString(), {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        // Xử lý chuyển hướng 3xx
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          redirectCount++;
          if (redirectCount > MAX_REDIRECTS) {
            return NextResponse.json(
              { success: false, message: 'Chuyển hướng vượt quá số lần cho phép (quá 3 lần).' },
              { status: 502 }
            );
          }
          const location = response.headers.get('location');
          if (!location) {
            return NextResponse.json(
              { success: false, message: 'Chuyển hướng nhưng máy chủ nguồn không cung cấp địa chỉ mới.' },
              { status: 502 }
            );
          }
          try {
            currentUrl = new URL(location, currentUrl);
          } catch {
            return NextResponse.json(
              { success: false, message: 'Địa chỉ chuyển hướng từ máy chủ nguồn không hợp lệ.' },
              { status: 502 }
            );
          }
          continue;
        }

        upstreamRes = response;
        break;
      }
    } catch (fetchErr: unknown) {
      if (
        fetchErr instanceof Error &&
        (fetchErr.name === 'AbortError' || fetchErr.message?.includes('aborted'))
      ) {
        return NextResponse.json(
          { success: false, message: 'Thời gian kết nối đến nguồn âm thanh đã hết hạn (Gateway Timeout).' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Lỗi mạng: Không thể kết nối tới máy chủ nguồn âm thanh.' },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!upstreamRes || !upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Nguồn âm thanh không phản hồi hoặc bị chặn bản quyền (HTTP ${upstreamRes?.status || 502}).`,
        },
        { status: 502 }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || 'audio/mpeg';

    // Không gửi Access-Control-Allow-Origin: * vì client gọi cùng origin
    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã xảy ra lỗi máy chủ khi chuyển tiếp âm thanh.',
      },
      { status: 500 }
    );
  }
}
