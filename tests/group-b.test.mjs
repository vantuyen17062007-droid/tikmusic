import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';
const testIp = `192.168.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
const baseHeaders = { 'X-Forwarded-For': testIp };

test('Group B: User Data and Playlists Test Suite', async (t) => {
  const testEmail = `user_b_${Date.now()}@example.com`;
  const password = 'StrongPassword123!';
  let sessionCookie = '';
  let playlistId = '';

  await t.test('Setup: Register and login test user', async () => {
    // Register
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({
        name: 'User B',
        email: testEmail,
        password,
        confirmPassword: password,
      }),
    });
    assert.equal(regRes.status, 201);

    // Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...baseHeaders },
      body: JSON.stringify({ email: testEmail, password }),
    });
    assert.equal(loginRes.status, 200);

    const setCookie = loginRes.headers.get('set-cookie');
    const match = setCookie.match(/tikmusic_session=([^;]+)/);
    assert.ok(match, 'Token exists');
    sessionCookie = match[0];
  });

  await t.test('B1: Unauthenticated request to /api/playlists returns empty array', async () => {
    const res = await fetch(`${BASE_URL}/api/playlists`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(data.playlists, []);
  });

  await t.test('B2: Authenticated user creates a new playlist', async () => {
    const res = await fetch(`${BASE_URL}/api/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ name: 'Playlist Nhạc Trẻ' }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.playlist.id);
    playlistId = data.playlist.id;
  });

  await t.test('B2: Add song to playlist (/api/playlists/[id]/songs)', async () => {
    const res = await fetch(`${BASE_URL}/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        song_id: 'song-1',
        title: 'Một đêm say',
        artist: 'RHYDER',
        duration: '2:45',
        cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
        audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
  });

  await t.test('B2: Duplicate song in playlist is prevented', async () => {
    const res = await fetch(`${BASE_URL}/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        song_id: 'song-1',
        title: 'Một đêm say',
        artist: 'RHYDER',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /đã có trong danh sách phát/);
  });

  await t.test('B2: Get playlist details and songs (/api/playlists/[id])', async () => {
    const res = await fetch(`${BASE_URL}/api/playlists/${playlistId}`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.playlist.songCount, 1);
    assert.equal(data.playlist.songs.length, 1);
    assert.equal(data.playlist.songs[0].song_id, 'song-1');
  });

  await t.test('B2: Remove song from playlist (/api/playlists/[id]/songs)', async () => {
    const res = await fetch(`${BASE_URL}/api/playlists/${playlistId}/songs?songId=song-1`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
  });

  await t.test('B2: Delete playlist (/api/playlists/[id])', async () => {
    const res = await fetch(`${BASE_URL}/api/playlists/${playlistId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
  });

  await t.test('B3: Unauthenticated like returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId: 'song-1' }),
    });
    assert.equal(res.status, 401);
  });

  await t.test('B3: Authenticated like succeeds and toggles', async () => {
    const res = await fetch(`${BASE_URL}/api/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ songId: 'song-1' }),
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.liked, true);
  });

  await t.test('B4: Record and fetch download history (/api/downloads)', async () => {
    const postRes = await fetch(`${BASE_URL}/api/downloads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        songId: 'song-1',
        songTitle: 'Một đêm say',
        quality: '320 kbps',
      }),
    });
    assert.equal(postRes.status, 200);

    const getRes = await fetch(`${BASE_URL}/api/downloads`, {
      headers: { Cookie: sessionCookie },
    });
    const getData = await getRes.json();
    assert.equal(getRes.status, 200);
    assert.ok(getData.downloads.length > 0);
    assert.equal(getData.downloads[0].song_id, 'song-1');
  });
});
