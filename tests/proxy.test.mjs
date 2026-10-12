import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const testIp = `192.168.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
const baseHeaders = { 'X-Forwarded-For': testIp };

test('Audio Proxy Security & Functionality Test Suite', async (t) => {
  await t.test('1. Proxy: Thiếu tham số url trả 400', async () => {
    const res = await fetch(`${BASE_URL}/api/audio/proxy`, {
      headers: baseHeaders,
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /Thiếu tham số url/);
  });

  await t.test('2. Proxy: Đường dẫn URL không hợp lệ trả 400', async () => {
    const res = await fetch(`${BASE_URL}/api/audio/proxy?url=not_a_valid_url`, {
      headers: baseHeaders,
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /không hợp lệ/);
  });

  await t.test('3. Proxy: Host ngoài allowlist bị chặn với 403', async () => {
    const disallowedUrls = [
      'https://example.com/sound.mp3',
      'https://attacker.com/malicious.mp3',
      'https://google.com/sound.mp3', // domain gốc google.com không được phép
      'https://tiktok.com/sound.mp3', // domain gốc tiktok.com không được phép
    ];

    for (const url of disallowedUrls) {
      const res = await fetch(`${BASE_URL}/api/audio/proxy?url=${encodeURIComponent(url)}`, {
        headers: baseHeaders,
      });
      const data = await res.json();
      assert.equal(res.status, 403, `URL ${url} phải trả về 403`);
      assert.equal(data.success, false);
      assert.match(data.message, /không nằm trong danh sách máy chủ được phép/);
    }
  });

  await t.test('4. Proxy: IP literal và localhost bị chặn với 403', async () => {
    const ipUrls = [
      'http://127.0.0.1/music.mp3',
      'http://127.0.0.1:8080/music.mp3',
      'http://169.254.169.254/latest/meta-data',
      'http://192.168.1.1/secret.ogg',
      'http://localhost/audio.mp3',
      'http://localhost:3000/api/auth/register',
      'http://service.internal/audio.mp3',
      'http://service.local/audio.mp3',
      'http://[::1]/music.mp3',
    ];

    for (const url of ipUrls) {
      const res = await fetch(`${BASE_URL}/api/audio/proxy?url=${encodeURIComponent(url)}`, {
        headers: baseHeaders,
      });
      const data = await res.json();
      assert.equal(res.status, 403, `IP URL ${url} phải bị chặn 403`);
      assert.equal(data.success, false);
      assert.match(data.message, /không nằm trong danh sách máy chủ được phép/);
    }
  });

  await t.test('5. Proxy: Giao diện làm sạch filename và Content-Disposition an toàn', async () => {
    const validUrl = 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg';
    const dirtyFilename = 'my"test\r\n;file\\name.mp3';
    const res = await fetch(
      `${BASE_URL}/api/audio/proxy?url=${encodeURIComponent(validUrl)}&filename=${encodeURIComponent(dirtyFilename)}`,
      { headers: baseHeaders }
    );

    assert.equal(res.status, 200);
    const contentDisposition = res.headers.get('content-disposition');
    assert.ok(contentDisposition, 'Phải có header content-disposition');
    assert.ok(!contentDisposition.includes('\r'), 'Không được chứa ký tự CR');
    assert.ok(!contentDisposition.includes('\n'), 'Không được chứa ký tự LF');
    assert.ok(!contentDisposition.includes('"my"test'), 'Không được chứa quote lồng');
  });

  await t.test('6. Proxy: URL hợp lệ từ allowlist hoạt động và trả về audio', async () => {
    const validAudioUrl = 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg';
    const res = await fetch(
      `${BASE_URL}/api/audio/proxy?url=${encodeURIComponent(validAudioUrl)}&filename=test.ogg`,
      { headers: baseHeaders }
    );

    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType, 'Phải có content-type');
    assert.match(contentType, /audio/i);
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 1000, 'Tệp tải về phải có dữ liệu thực tế');
  });

  await t.test('7. Proxy: Rate limit trả 429 khi gọi vượt quá 60 requests/phút', async () => {
    const spamIp = `172.16.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
    const spamHeaders = { 'X-Forwarded-For': spamIp };
    const validAudioUrl = 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg';

    let hit429 = false;
    for (let i = 0; i < 65; i++) {
      const res = await fetch(
        `${BASE_URL}/api/audio/proxy?url=${encodeURIComponent(validAudioUrl)}`,
        { headers: spamHeaders }
      );
      if (res.status === 429) {
        hit429 = true;
        const data = await res.json();
        assert.equal(data.success, false);
        assert.match(data.message, /Vượt quá giới hạn/);
        break;
      }
    }
    assert.equal(hit429, true, 'Sau 60 requests phải bị giới hạn với 429');
  });
});
