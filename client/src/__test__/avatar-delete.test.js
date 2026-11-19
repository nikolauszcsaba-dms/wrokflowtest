import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import { apiRequest } from '../api.js';

const profileJsx = readFileSync(new URL('../pages/Profile.jsx', import.meta.url), 'utf8');
const avatarJsx = readFileSync(new URL('../components/Avatar.jsx', import.meta.url), 'utf8');
const avatarForm = profileJsx.slice(profileJsx.indexOf('const AvatarForm = '), profileJsx.indexOf('const PasswordForm = '));

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

test('a törlés DELETE kérést küld törzs nélkül, és visszaadja a felhasználót', async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
        calls.push({ url, options });
        return new Response(JSON.stringify({ id: '1', email: 'a@b.hu', avatarUrl: null }), { status: 200 });
    };

    const user = await apiRequest('DELETE', '/api/users/avatar');

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/users/avatar');
    assert.equal(calls[0].options.method, 'DELETE');
    assert.equal(calls[0].options.body, undefined);
    assert.equal(user.avatarUrl, null);
});

test('sikertelen törlésnél a szerver hibaüzenete jön vissza', async () => {
    globalThis.fetch = async () => new Response(
        JSON.stringify({ errors: [{ message: 'Not authorized' }] }),
        { status: 401 }
    );

    await assert.rejects(apiRequest('DELETE', '/api/users/avatar'), { message: 'Not authorized' });
});

test('a profilkép dobozban a törlés gomb csak akkor látszik, ha van kép', () => {
    assert.match(
        avatarForm,
        /\{user\.avatarUrl && \(\s*<button type="button"[^>]*onClick=\{handleDelete\}[^>]*>\s*Profilkép törlése\s*<\/button>/
    );
});

test('a törlés a szervert hívja, frissíti a felhasználót, és visszajelez', () => {
    const handler = avatarForm.slice(avatarForm.indexOf('const handleDelete = '));

    assert.match(handler, /setUser\(await apiRequest\('DELETE', '\/api\/users\/avatar'\)\)/);
    assert.match(handler, /setSuccess\('A profilkép törölve\.'\)/);
});

test('kép nélkül az alapértelmezett ikon jelenik meg', () => {
    assert.match(avatarJsx, /\{url \? \([\s\S]*<img[\s\S]*\) : \([\s\S]*<svg/);
});
