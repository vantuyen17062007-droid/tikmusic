import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';
const testIp = `192.168.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
const baseHeaders = { 'X-Forwarded-For': testIp };

test('Group A: Security and Authentication Test Suite', async (t) => {
  const testEmail = `test_a_${Date.now()}@example.com`;
  const validPassword = 'SecurePassword123!';
  let sessionCookie = '';

  await t.test('A5: Password < 8 chars must be rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        name: 'Test User',
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

  await t.test('A3/A4/A5: Register valid user with >= 8 chars password', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        name: 'Test User',
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

  await t.test('A3/A4: Duplicate email returns generic message without disclosing existence', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        name: 'Duplicate Test',
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

  await t.test('A9: CSRF protection rejects mismatched Origin', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil-hacker.com',
        ...baseHeaders,
      },
      body: JSON.stringify({
        email: testEmail,
        password: validPassword,
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.match(data.message, /CSRF/);
  });

  await t.test('A1/A6/A7: Successful login creates hashed session in DB and returns secure cookie', async () => {
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

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header must be present');
    assert.match(setCookie, /tikmusic_session=/);
    assert.match(setCookie, /HttpOnly/i);

    // Extract cookie
    const match = setCookie.match(/tikmusic_session=([^;]+)/);
    assert.ok(match, 'Token must exist');
    sessionCookie = match[0];
  });

  await t.test('A8: Verify authenticated session using cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.user);
    assert.equal(data.user.email, testEmail.toLowerCase());
  });

  await t.test('A6/A8: Logout revokes session from database, old token rejected', async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    assert.equal(logoutRes.status, 200);

    // Truy vấn lại bằng token cũ
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    const meData = await meRes.json();
    assert.equal(meData.user, null, 'User session must be null after logout');
  });

  await t.test('A11: TikTok URL extraction with exact handle matching', async () => {
    // Link mẫu hợp lệ khớp handle @rhyder
    const sampleRes = await fetch(`${BASE_URL}/api/tiktok/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.tiktok.com/@rhyder/video/1234567890',
      }),
    });
    const sampleData = await sampleRes.json();
    assert.equal(sampleRes.status, 200);
    assert.equal(sampleData.success, true);
    assert.equal(sampleData.isDemoCatalog, true);

    // Link không phải TikTok
    const invalidRes = await fetch(`${BASE_URL}/api/tiktok/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://youtube.com/watch?v=123',
      }),
    });
    assert.equal(invalidRes.status, 400);
  });
});
