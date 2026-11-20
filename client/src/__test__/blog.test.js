import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import {
    addComment,
    canEditComment,
    commentAnchor,
    createPost,
    getPost,
    isEdited,
    listPosts,
    replaceComment,
    updateComment,
} from '../blog.js';

const layoutJsx = readFileSync(new URL('../components/Layout.jsx', import.meta.url), 'utf8');
const appJsx = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
const blogJsx = readFileSync(new URL('../pages/Blog.jsx', import.meta.url), 'utf8');
const postJsx = readFileSync(new URL('../pages/BlogPost.jsx', import.meta.url), 'utf8');

const originalFetch = globalThis.fetch;

const mockFetch = (response = {}, status = 200) => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
        calls.push({ url, options, body: options.body ? JSON.parse(options.body) : undefined });
        return new Response(JSON.stringify(response), { status });
    };
    return calls;
};

afterEach(() => {
    globalThis.fetch = originalFetch;
});

test('a lista a postokat GET kéréssel kéri le', async () => {
    const calls = mockFetch([{ id: '1', title: 'Cím', excerpt: 'Rövid' }]);

    const posts = await listPosts();

    assert.equal(calls[0].url, '/api/posts');
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(posts[0].title, 'Cím');
});

test('az új post csak a címet és a leírást küldi, a dátumot nem', async () => {
    const calls = mockFetch({ id: '1' }, 201);

    await createPost({ title: 'Cím', description: 'Leírás', createdAt: '2000-01-01' });

    assert.equal(calls[0].url, '/api/posts');
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(calls[0].body, { title: 'Cím', description: 'Leírás' });
});

test('a részletes nézet a post azonosítójával kér', async () => {
    const calls = mockFetch({ post: {}, comments: [] });

    await getPost('abc/def');

    assert.equal(calls[0].url, '/api/posts/abc%2Fdef');
});

test('a komment a post alá megy, válasznál az előzmény azonosítójával', async () => {
    const calls = mockFetch({ id: 'c2' }, 201);

    await addComment('p1', 'Első');
    await addComment('p1', 'Válasz', 'c1');

    assert.equal(calls[0].url, '/api/posts/p1/comments');
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(calls[0].body, { body: 'Első', parentId: null });
    assert.deepEqual(calls[1].body, { body: 'Válasz', parentId: 'c1' });
});

test('a komment szerkesztése PUT kérés, csak a szöveggel', async () => {
    const calls = mockFetch({ id: 'c1', body: 'Új' });

    await updateComment('p1', 'c1', 'Új');

    assert.equal(calls[0].url, '/api/posts/p1/comments/c1');
    assert.equal(calls[0].options.method, 'PUT');
    assert.deepEqual(calls[0].body, { body: 'Új' });
});

test('a tiltott szerkesztésnél a szerver hibaüzenete jön vissza', async () => {
    mockFetch({ errors: [{ message: 'Ehhez nincs jogosultságod' }] }, 403);

    await assert.rejects(updateComment('p1', 'c1', 'Új'), { message: 'Ehhez nincs jogosultságod' });
});

test('szerkeszteni csak a saját kommentet lehet', () => {
    const comment = { id: 'c1', author: { id: 'u1', email: 'a@b.hu' } };

    assert.equal(canEditComment(comment, { id: 'u1' }), true);
    assert.equal(canEditComment(comment, { id: 'u2' }), false);
    assert.equal(canEditComment(comment, null), false);
    assert.equal(canEditComment({ id: 'c2', author: { id: undefined } }, { id: undefined }), false);
});

test('a szerkesztett komment felismerhető', () => {
    assert.equal(isEdited({ createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:00:00Z' }), false);
    assert.equal(isEdited({ createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:05:00Z' }), true);
});

test('a mentett komment a helyére kerül a listában', () => {
    const list = [{ id: 'a', body: '1' }, { id: 'b', body: '2' }];

    assert.deepEqual(replaceComment(list, { id: 'b', body: 'új' }), [{ id: 'a', body: '1' }, { id: 'b', body: 'új' }]);
    assert.equal(commentAnchor('x1'), 'comment-x1');
});

test('a bal menüben van Blog menüpont, és a /blog oldalakra visz', () => {
    assert.match(layoutJsx, /<NavLink to="\/blog" className="menu-item" onClick=\{closeMenu\}>Blog<\/NavLink>/);
    assert.match(appJsx, /<Route path="\/blog" element=\{<Blog \/>\} \/>/);
    assert.match(appJsx, /<Route path="\/blog\/:id" element=\{<BlogPost \/>\} \/>/);

    const protectedRoutes = appJsx.slice(appJsx.indexOf('<RequireAuth><Layout />'), appJsx.indexOf('<Route path="*"'));
    assert.match(protectedRoutes, /path="\/blog"/);
});

test('a lista a címet, a rövid szöveget és egy Tovább... linket mutat', () => {
    assert.match(blogJsx, /\{post\.title\}/);
    assert.match(blogJsx, /\{post\.excerpt\}/);
    assert.doesNotMatch(blogJsx, /post\.description/);
    assert.match(blogJsx, /<Link to=\{`\/blog\/\$\{post\.id\}`\} className="post-more">Tovább\.\.\.<\/Link>/);
    assert.doesNotMatch(blogJsx, /Megnyitás/);
});

test('a válasz fejlécében jobb oldalon link mutat az előzményre', () => {
    const header = postJsx.match(/<div className="comment-header">([\s\S]*?)<\/div>/);
    assert.ok(header, 'a komment fejléce hiányzik');

    const meta = header[1].indexOf('comment-meta');
    const link = header[1].indexOf('comment-parent-link');
    assert.ok(meta !== -1 && link > meta, 'az előzmény link a fejléc jobb oldalán legyen');
    assert.match(header[1], /\{comment\.parentId && \(/);
    assert.match(header[1], /href=\{`#\$\{commentAnchor\(comment\.parentId\)\}`\}/);
    assert.match(postJsx, /<li id=\{commentAnchor\(comment\.id\)\}/);
});

test('a szerkesztés gomb csak a saját kommentnél jelenik meg', () => {
    assert.match(
        postJsx,
        /\{canEditComment\(comment, user\) && \(\s*<button[^>]*onClick=\{\(\) => setEditing\(true\)\}>Szerkesztés<\/button>/
    );
});
