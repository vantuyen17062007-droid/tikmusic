import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const testIp = `192.168.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
const baseHeaders = { 'X-Forwarded-For': testIp };

test('F6 & Group A: Comprehensive Authentication & Session Test Suite', async (t) => {
  const testEmail = `authtest_${Date.now()}@example.com`;
  const validPassword = 'CorrectPassword123!';
  const wrongPassword = 'WrongPassword456!';
  let sessionCookie = '';

  await t.test('1. Register: Mật khẩu < 8 ký tự bị từ chối với 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        name: 'Short Pass User',
        email: testEmail,
        password: 'short',
        confirmPassword: 'short',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /8 ký tự/);
  });

  await t.test('2. Register: Đăng ký thành công tài khoản hợp lệ', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        name: 'Auth Test User',
        email: testEmail,
        password: validPassword,
        confirmPassword: validPassword,
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.user.email, testEmail.toLowerCase());
  });

  await t.test('3. Register trùng email: Trả thông báo chung bảo mật (A3/A4)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        name: 'Duplicate Register',
        email: testEmail,
        password: validPassword,
        confirmPassword: validPassword,
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /Không thể tạo tài khoản với thông tin này/);
  });

  await t.test('4. Login sai mật khẩu: Bị từ chối với 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        email: testEmail,
        password: wrongPassword,
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.match(data.message, /Email hoặc mật khẩu không chính xác/);
  });

  await t.test('5. Login đúng mật khẩu: Thành công 200 và cấp HttpOnly cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        email: testEmail,
        password: validPassword,
        remember: true,
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.user);

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Must set cookie');
    assert.match(setCookie, /tikmusic_session=/);
    assert.match(setCookie, /HttpOnly/i);

    const match = setCookie.match(/tikmusic_session=([^;]+)/);
    assert.ok(match);
    sessionCookie = match[0];
  });

  await t.test('6. Me (/api/auth/me): Xác thực thành công thông tin người dùng với cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie, ...baseHeaders },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.user);
    assert.equal(data.user.email, testEmail.toLowerCase());
  });

  await t.test('7. Logout: Hủy phiên trong DB, token cũ không còn dùng được', async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie, ...baseHeaders },
    });
    assert.equal(logoutRes.status, 200);

    // Gửi lại request với cookie cũ
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie, ...baseHeaders },
    });
    const meData = await meRes.json();
    assert.equal(meData.user, null, 'User session must be null after logout');
  });

  await t.test('8. Rate limit (A1): Vượt quá giới hạn request liên tục trả 429', async () => {
    const spamIp = `172.16.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
    const spamHeaders = {
      'Content-Type': 'application/json',
      'X-Forwarded-For': spamIp,
    };

    let hit429 = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: spamHeaders,
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        }),
      });
      if (res.status === 429) {
        hit429 = true;
        const data = await res.json();
        assert.match(data.message, /quá nhiều lần/);
        break;
      }
    }
    assert.equal(hit429, true, 'Login attempts over limit must receive 429');
  });
});
