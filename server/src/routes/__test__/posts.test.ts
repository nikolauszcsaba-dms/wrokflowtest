import request from 'supertest';
import { app } from '../../app';
import { MAX_COMMENT_LENGTH, MAX_TITLE_LENGTH } from '../posts';

const createPost = async (cookie: string[], title = 'Első post', description = 'A post leírása') => {
    const response = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ title, description })
        .expect(201);

    return response.body;
};

const addComment = (cookie: string[], postId: string, body: string, parentId?: string | null) =>
    request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Cookie', cookie)
        .send({ body, parentId });

describe('authentication', () => {
    it('returns 401 when listing posts without authentication', async () => {
        await request(app).get('/api/posts').send().expect(401);
    });

    it('returns 401 when creating a post without authentication', async () => {
        await request(app)
            .post('/api/posts')
            .send({ title: 'Cím', description: 'Leírás' })
            .expect(401);
    });

    it('returns 401 when reading a post without authentication', async () => {
        const post = await createPost(await global.signin());

        await request(app).get(`/api/posts/${post.id}`).send().expect(401);
    });

    it('returns 401 when commenting without authentication', async () => {
        const post = await createPost(await global.signin());

        await request(app)
            .post(`/api/posts/${post.id}/comments`)
            .send({ body: 'Komment' })
            .expect(401);
    });

    it('returns 401 when editing a comment without authentication', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);
        const { body: comment } = await addComment(cookie, post.id, 'Komment').expect(201);

        await request(app)
            .put(`/api/posts/${post.id}/comments/${comment.id}`)
            .send({ body: 'Átírva' })
            .expect(401);
    });
});

describe('posts', () => {
    it('creates a post with the current date and the author', async () => {
        const cookie = await global.signin('author@test.com');
        const before = Date.now();

        const post = await createPost(cookie, '  Cím  ', '  Leírás  ');

        expect(post.title).toEqual('Cím');
        expect(post.description).toEqual('Leírás');
        expect(post.author.email).toEqual('author@test.com');
        expect(Object.keys(post.author).sort()).toEqual(['email', 'id']);
        expect(new Date(post.createdAt).getTime()).toBeGreaterThanOrEqual(before);
        expect(new Date(post.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('ignores a date sent by the client', async () => {
        const cookie = await global.signin();

        const response = await request(app)
            .post('/api/posts')
            .set('Cookie', cookie)
            .send({ title: 'Cím', description: 'Leírás', createdAt: '2000-01-01T00:00:00.000Z' })
            .expect(201);

        expect(new Date(response.body.createdAt).getFullYear()).not.toEqual(2000);
    });

    it('requires a title and a description', async () => {
        const cookie = await global.signin();

        const response = await request(app)
            .post('/api/posts')
            .set('Cookie', cookie)
            .send({ title: '   ', description: '' })
            .expect(400);

        expect(response.body.errors.map((e: { message: string }) => e.message)).toEqual([
            'A cím megadása kötelező',
            'A leírás megadása kötelező',
        ]);
    });

    it('rejects a title longer than the limit', async () => {
        const cookie = await global.signin();

        await request(app)
            .post('/api/posts')
            .set('Cookie', cookie)
            .send({ title: 'x'.repeat(MAX_TITLE_LENGTH + 1), description: 'Leírás' })
            .expect(400);
    });

    it('lists posts newest first with the title and the first 100 characters', async () => {
        const cookie = await global.signin();
        const long = `${'a'.repeat(100)}ez már nem látszik`;

        await createPost(cookie, 'Régebbi', 'Rövid leírás');
        await createPost(cookie, 'Újabb', long);

        const response = await request(app)
            .get('/api/posts')
            .set('Cookie', cookie)
            .send()
            .expect(200);

        expect(response.body.map((p: { title: string }) => p.title)).toEqual(['Újabb', 'Régebbi']);
        expect(response.body[0].excerpt).toEqual(`${'a'.repeat(100)}…`);
        expect(response.body[0].description).toBeUndefined();
        expect(response.body[1].excerpt).toEqual('Rövid leírás');
    });

    it('returns the full post with its comments', async () => {
        const cookie = await global.signin();
        const long = 'b'.repeat(300);
        const post = await createPost(cookie, 'Cím', long);
        await addComment(cookie, post.id, 'Első komment').expect(201);
        await addComment(cookie, post.id, 'Második komment').expect(201);

        const response = await request(app)
            .get(`/api/posts/${post.id}`)
            .set('Cookie', cookie)
            .send()
            .expect(200);

        expect(response.body.post.description).toEqual(long);
        expect(response.body.comments.map((c: { body: string }) => c.body)).toEqual([
            'Első komment',
            'Második komment',
        ]);
    });

    it('returns 404 for a missing or invalid post id', async () => {
        const cookie = await global.signin();

        await request(app).get('/api/posts/000000000000000000000000').set('Cookie', cookie).expect(404);
        await request(app).get('/api/posts/nem-letezik').set('Cookie', cookie).expect(404);
    });

    it('does not expose the password or the avatar of the author', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);
        await addComment(cookie, post.id, 'Komment').expect(201);

        const response = await request(app)
            .get(`/api/posts/${post.id}`)
            .set('Cookie', cookie)
            .send()
            .expect(200);

        const text = JSON.stringify(response.body);
        expect(text).not.toContain('password');
        expect(text).not.toContain('avatar');
        expect(Object.keys(response.body.post.author).sort()).toEqual(['email', 'id']);
        expect(Object.keys(response.body.comments[0].author).sort()).toEqual(['email', 'id']);
        expect(response.body.comments[0].author.id).toMatch(/^[0-9a-f]{24}$/);
    });
});

describe('comments', () => {
    it('creates a comment by the current user', async () => {
        const cookie = await global.signin('commenter@test.com');
        const post = await createPost(cookie);

        const response = await addComment(cookie, post.id, '  Szép post  ').expect(201);

        expect(response.body.body).toEqual('Szép post');
        expect(response.body.postId).toEqual(post.id);
        expect(response.body.parentId).toBeNull();
        expect(response.body.author.email).toEqual('commenter@test.com');
    });

    it('requires the comment text', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);

        const response = await addComment(cookie, post.id, '   ').expect(400);

        expect(response.body.errors[0].message).toEqual('A komment szövege kötelező');
    });

    it('rejects a comment longer than the limit', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);

        await addComment(cookie, post.id, 'k'.repeat(MAX_COMMENT_LENGTH + 1)).expect(400);
    });

    it('returns 404 when commenting on a missing post', async () => {
        const cookie = await global.signin();

        await addComment(cookie, '000000000000000000000000', 'Komment').expect(404);
    });

    it('stores a reply with a reference to the earlier comment', async () => {
        const cookie = await global.signin();
        const other = await global.signin('other@test.com');
        const post = await createPost(cookie);
        const { body: first } = await addComment(cookie, post.id, 'Kérdés').expect(201);

        const { body: reply } = await addComment(other, post.id, 'Válasz', first.id).expect(201);

        expect(reply.parentId).toEqual(first.id);
    });

    it('rejects a reply to a comment of another post', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie, 'Egyik');
        const otherPost = await createPost(cookie, 'Másik');
        const { body: comment } = await addComment(cookie, otherPost.id, 'Másik post kommentje').expect(201);

        const response = await addComment(cookie, post.id, 'Válasz', comment.id).expect(400);

        expect(response.body.errors[0].message).toEqual('Az előzmény komment nem található');
    });

    it('rejects a reply to a missing or invalid comment', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);

        await addComment(cookie, post.id, 'Válasz', '000000000000000000000000').expect(400);
        await addComment(cookie, post.id, 'Válasz', 'nem-letezik').expect(400);
    });

    it('lets the author edit their own comment', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);
        const { body: comment } = await addComment(cookie, post.id, 'Eredeti').expect(201);

        const response = await request(app)
            .put(`/api/posts/${post.id}/comments/${comment.id}`)
            .set('Cookie', cookie)
            .send({ body: 'Javított' })
            .expect(200);

        expect(response.body.body).toEqual('Javított');
        expect(response.body.id).toEqual(comment.id);

        const { body: detail } = await request(app)
            .get(`/api/posts/${post.id}`)
            .set('Cookie', cookie)
            .expect(200);
        expect(detail.comments[0].body).toEqual('Javított');
    });

    it('keeps the reply reference when a reply is edited', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);
        const { body: first } = await addComment(cookie, post.id, 'Kérdés').expect(201);
        const { body: reply } = await addComment(cookie, post.id, 'Válasz', first.id).expect(201);

        const response = await request(app)
            .put(`/api/posts/${post.id}/comments/${reply.id}`)
            .set('Cookie', cookie)
            .send({ body: 'Javított válasz', parentId: null })
            .expect(200);

        expect(response.body.parentId).toEqual(first.id);
    });

    it('forbids editing the comment of another user', async () => {
        const owner = await global.signin('owner@test.com');
        const intruder = await global.signin('intruder@test.com');
        const post = await createPost(owner);
        const { body: comment } = await addComment(owner, post.id, 'Saját').expect(201);

        const response = await request(app)
            .put(`/api/posts/${post.id}/comments/${comment.id}`)
            .set('Cookie', intruder)
            .send({ body: 'Átírva' })
            .expect(403);

        expect(response.body.errors[0].message).toEqual('Ehhez nincs jogosultságod');

        const { body: detail } = await request(app)
            .get(`/api/posts/${post.id}`)
            .set('Cookie', owner)
            .expect(200);
        expect(detail.comments[0].body).toEqual('Saját');
    });

    it('returns 404 when the comment does not belong to the post', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie, 'Egyik');
        const otherPost = await createPost(cookie, 'Másik');
        const { body: comment } = await addComment(cookie, otherPost.id, 'Komment').expect(201);

        await request(app)
            .put(`/api/posts/${post.id}/comments/${comment.id}`)
            .set('Cookie', cookie)
            .send({ body: 'Átírva' })
            .expect(404);
    });

    it('rejects an empty edit', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);
        const { body: comment } = await addComment(cookie, post.id, 'Eredeti').expect(201);

        await request(app)
            .put(`/api/posts/${post.id}/comments/${comment.id}`)
            .set('Cookie', cookie)
            .send({ body: '  ' })
            .expect(400);
    });
});
