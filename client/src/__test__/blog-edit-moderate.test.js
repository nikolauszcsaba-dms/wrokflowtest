import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import {
    canEditComment,
    canEditPost,
    canModerateComment,
    isPostEdited,
    moderateComment,
    updatePost,
} from '../blog.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const appJsx = read('../App.jsx');
const blogJsx = read('../pages/Blog.jsx');
const formJsx = read('../pages/BlogPostForm.jsx');
const postJsx = read('../pages/BlogPost.jsx');
const css = read('../styles.css');

const rule = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`(?:^|\\n)[^{}]*${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`));
    assert.ok(match, `hiányzik a ${selector} szabály`);
    return match[1];
};

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

const author = { id: 'u1', email: 'szerzo@b.hu' };
const other = { id: 'u2', email: 'masik@b.hu' };

test('a lista oldalon nincs létrehozó űrlap, a tetején Új felvitel gomb visz a létrehozó oldalra', () => {
    assert.doesNotMatch(blogJsx, /<form/);
    assert.doesNotMatch(blogJsx, /createPost/);

    const header = blogJsx.indexOf('blog-header');
    const button = blogJsx.indexOf('<Link to="/blog/new" className="btn btn-primary">Új felvitel</Link>');
    const list = blogJsx.indexOf('post-list');
    assert.ok(header !== -1 && button > header && button < list, 'az Új felvitel gomb a lista fölött legyen');
});

test('a létrehozás és a szerkesztés külön oldal, a bejelentkezett felhasználóknak', () => {
    assert.match(appJsx, /<Route path="\/blog\/new" element=\{<BlogPostForm \/>\} \/>/);
    assert.match(appJsx, /<Route path="\/blog\/:id\/edit" element=\{<BlogPostForm \/>\} \/>/);

    const protectedRoutes = appJsx.slice(appJsx.indexOf('<RequireAuth><Layout />'), appJsx.indexOf('<Route path="*"'));
    assert.match(protectedRoutes, /path="\/blog\/new"/);
    assert.match(protectedRoutes, /path="\/blog\/:id\/edit"/);
});

test('mentés után a post oldalára jutunk', () => {
    assert.match(formJsx, /editing \? await updatePost\(id, values\) : await createPost\(values\)/);
    assert.match(formJsx, /navigate\(`\/blog\/\$\{post\.id\}`\)/);
});

test('a Tovább... link jobbra igazított link, nem gomb', () => {
    assert.doesNotMatch(blogJsx, /className="btn[^"]*">Tovább/);
    assert.match(rule('.post-more'), /align-self:\s*flex-end/);
});

test('a post szerkesztése PUT kérés, csak a címmel és a leírással', async () => {
    const calls = mockFetch({ id: 'p/1' });

    await updatePost('p/1', { title: 'Cím', description: 'Leírás', author: 'u2', editedAt: null });

    assert.equal(calls[0].url, '/api/posts/p%2F1');
    assert.equal(calls[0].options.method, 'PUT');
    assert.deepEqual(calls[0].body, { title: 'Cím', description: 'Leírás' });
});

test('postot csak a szerzője szerkeszthet', () => {
    const post = { id: 'p1', author };

    assert.equal(canEditPost(post, author), true);
    assert.equal(canEditPost(post, other), false);
    assert.equal(canEditPost(post, null), false);
    assert.equal(canEditPost({ id: 'p2', author: { id: undefined } }, { id: undefined }), false);
    assert.match(postJsx, /\{canEditPost\(post, user\) && \(\s*<Link to=\{`\/blog\/\$\{post\.id\}\/edit`\}[^>]*>Szerkesztés<\/Link>/);
    assert.match(formJsx, /canEditPost\(post, \{ id: userId \}\)/);
});

test('a szerkesztett post jelölve van a részletes nézetben és a listában', () => {
    assert.equal(isPostEdited({ editedAt: null }), false);
    assert.equal(isPostEdited({}), false);
    assert.equal(isPostEdited({ editedAt: '2026-01-01T10:05:00Z' }), true);
    assert.match(postJsx, /\{isPostEdited\(post\) && ' · szerkesztve'\}/);
    assert.match(blogJsx, /\{isPostEdited\(post\) && ' · szerkesztve'\}/);
});

test('a moderálás POST kérés a komment moderate címére, törzs nélkül', async () => {
    const calls = mockFetch({ id: 'c1', moderated: true });

    await moderateComment('p1', 'c/1');

    assert.equal(calls[0].url, '/api/posts/p1/comments/c%2F1/moderate');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].body, undefined);
});

test('a tiltott moderálásnál a szerver hibaüzenete jön vissza', async () => {
    mockFetch({ errors: [{ message: 'Ehhez nincs jogosultságod' }] }, 403);

    await assert.rejects(moderateComment('p1', 'c1'), { message: 'Ehhez nincs jogosultságod' });
});

test('kommentet csak a post szerzője moderálhat, és csak egyszer', () => {
    const post = { id: 'p1', author };
    const comment = { id: 'c1', author: other, moderated: false };

    assert.equal(canModerateComment(post, comment, author), true);
    assert.equal(canModerateComment(post, { ...comment, author }, author), true);
    assert.equal(canModerateComment(post, comment, other), false);
    assert.equal(canModerateComment(post, comment, null), false);
    assert.equal(canModerateComment(post, { ...comment, moderated: true }, author), false);
    assert.match(
        postJsx,
        /\{canModerateComment\(post, comment, user\) && \(\s*<button[^>]*onClick=\{handleModerate\}[^>]*>Moderálás<\/button>/
    );
});

test('a moderált kommentet a szerzője már nem szerkesztheti', () => {
    const comment = { id: 'c1', author: other, moderated: true };

    assert.equal(canEditComment(comment, other), false);
    assert.equal(canEditComment({ ...comment, moderated: false }, other), true);
});

test('a moderált komment jelölve van, és a szövege eltér a többitől', () => {
    assert.match(postJsx, /comment\.moderated \? ' · moderálva' : isEdited\(comment\) && ' · szerkesztve'/);
    assert.match(postJsx, /comment\.moderated \? 'comment-body comment-moderated' : 'comment-body'/);
    assert.match(rule('.comment-moderated'), /font-style:\s*italic/);
});
