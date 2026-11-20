import request from 'supertest';
import { app } from '../../app';
import { MAX_COMMENT_LENGTH, MAX_TITLE_LENGTH, MODERATED_COMMENT_TEXT } from '../posts';

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

const editPost = (cookie: string[], postId: string, fields: Record<string, unknown>) =>
    request(app)
        .put(`/api/posts/${postId}`)
        .set('Cookie', cookie)
        .send(fields);

const moderate = (cookie: string[], postId: string, commentId: string) =>
    request(app)
        .post(`/api/posts/${postId}/comments/${commentId}/moderate`)
        .set('Cookie', cookie)
        .send();

const getDetail = async (cookie: string[], postId: string) => {
    const response = await request(app)
        .get(`/api/posts/${postId}`)
        .set('Cookie', cookie)
        .expect(200);

    return response.body;
};

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

    it('returns 401 when editing a post without authentication', async () => {
        const post = await createPost(await global.signin());

        await request(app)
            .put(`/api/posts/${post.id}`)
            .send({ title: 'Átírva', description: 'Átírva' })
            .expect(401);
    });

    it('returns 401 when moderating a comment without authentication', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);
        const { body: comment } = await addComment(cookie, post.id, 'Komment').expect(201);

        await request(app)
            .post(`/api/posts/${post.id}/comments/${comment.id}/moderate`)
            .send()
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

describe('post editing', () => {
    it('is not marked as edited right after creation', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);

        expect(post.editedAt).toBeNull();
        expect((await getDetail(cookie, post.id)).post.editedAt).toBeNull();
    });

    it('lets the author edit the title and the description and marks the post as edited', async () => {
        const cookie = await global.signin('author@test.com');
        const post = await createPost(cookie, 'Eredeti cím', 'Eredeti leírás');
        const before = Date.now();

        const response = await editPost(cookie, post.id, { title: '  Új cím  ', description: '  Új leírás  ' })
            .expect(200);

        expect(response.body.id).toEqual(post.id);
        expect(response.body.title).toEqual('Új cím');
        expect(response.body.description).toEqual('Új leírás');
        expect(response.body.author.email).toEqual('author@test.com');
        expect(Object.keys(response.body.author).sort()).toEqual(['email', 'id']);
        expect(response.body.createdAt).toEqual(post.createdAt);
        expect(new Date(response.body.editedAt).getTime()).toBeGreaterThanOrEqual(before);

        const { post: stored } = await getDetail(cookie, post.id);
        expect(stored.title).toEqual('Új cím');
        expect(stored.description).toEqual('Új leírás');
        expect(stored.editedAt).toEqual(response.body.editedAt);
    });

    it('shows the edit mark in the list too', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);
        await editPost(cookie, post.id, { title: 'Új cím', description: 'Új leírás' }).expect(200);

        const { body: list } = await request(app).get('/api/posts').set('Cookie', cookie).expect(200);

        expect(list[0].title).toEqual('Új cím');
        expect(list[0].excerpt).toEqual('Új leírás');
        expect(list[0].editedAt).not.toBeNull();
    });

    it('forbids editing the post of another user', async () => {
        const owner = await global.signin('owner@test.com');
        const intruder = await global.signin('intruder@test.com');
        const post = await createPost(owner, 'Saját cím', 'Saját leírás');

        const response = await editPost(intruder, post.id, { title: 'Átírva', description: 'Átírva' })
            .expect(403);

        expect(response.body.errors[0].message).toEqual('Ehhez nincs jogosultságod');

        const { post: stored } = await getDetail(owner, post.id);
        expect(stored.title).toEqual('Saját cím');
        expect(stored.description).toEqual('Saját leírás');
        expect(stored.editedAt).toBeNull();
    });

    it('does not let the client change the author or the creation date', async () => {
        const owner = await global.signin('owner@test.com');
        const other = await global.signin('other@test.com');
        const otherPost = await createPost(other);
        const post = await createPost(owner);

        const response = await editPost(owner, post.id, {
            title: 'Cím',
            description: 'Leírás',
            author: otherPost.author.id,
            createdAt: '2000-01-01T00:00:00.000Z',
            editedAt: null,
        }).expect(200);

        expect(response.body.author.email).toEqual('owner@test.com');
        expect(response.body.createdAt).toEqual(post.createdAt);
        expect(response.body.editedAt).not.toBeNull();
    });

    it('validates the edited fields like a new post', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);

        const response = await editPost(cookie, post.id, { title: ' ', description: '' }).expect(400);

        expect(response.body.errors.map((e: { message: string }) => e.message)).toEqual([
            'A cím megadása kötelező',
            'A leírás megadása kötelező',
        ]);
        await editPost(cookie, post.id, { title: 'x'.repeat(MAX_TITLE_LENGTH + 1), description: 'Leírás' })
            .expect(400);
    });

    it('returns 404 for a missing or invalid post id', async () => {
        const cookie = await global.signin();
        const fields = { title: 'Cím', description: 'Leírás' };

        await editPost(cookie, '000000000000000000000000', fields).expect(404);
        await editPost(cookie, 'nem-letezik', fields).expect(404);
    });
});

describe('comment moderation', () => {
    it('lets the author of the post moderate a comment of another user', async () => {
        const postAuthor = await global.signin('author@test.com');
        const commenter = await global.signin('commenter@test.com');
        const post = await createPost(postAuthor);
        const { body: comment } = await addComment(commenter, post.id, 'Csúnya szöveg').expect(201);

        const response = await moderate(postAuthor, post.id, comment.id).expect(200);

        expect(response.body.id).toEqual(comment.id);
        expect(response.body.body).toEqual(MODERATED_COMMENT_TEXT);
        expect(response.body.moderated).toBe(true);
        expect(response.body.author.email).toEqual('commenter@test.com');

        const { comments } = await getDetail(commenter, post.id);
        expect(comments[0].body).toEqual(MODERATED_COMMENT_TEXT);
        expect(comments[0].moderated).toBe(true);
        expect(JSON.stringify(comments)).not.toContain('Csúnya szöveg');
    });

    it('marks new comments as not moderated', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);

        const { body: comment } = await addComment(cookie, post.id, 'Komment').expect(201);

        expect(comment.moderated).toBe(false);
    });

    it('keeps the reply reference of a moderated comment', async () => {
        const postAuthor = await global.signin('author@test.com');
        const commenter = await global.signin('commenter@test.com');
        const post = await createPost(postAuthor);
        const { body: first } = await addComment(postAuthor, post.id, 'Kérdés').expect(201);
        const { body: reply } = await addComment(commenter, post.id, 'Válasz', first.id).expect(201);

        const response = await moderate(postAuthor, post.id, reply.id).expect(200);

        expect(response.body.parentId).toEqual(first.id);
    });

    it('forbids moderation by anyone else, even by the author of the comment', async () => {
        const postAuthor = await global.signin('author@test.com');
        const commenter = await global.signin('commenter@test.com');
        const intruder = await global.signin('intruder@test.com');
        const post = await createPost(postAuthor);
        const { body: comment } = await addComment(commenter, post.id, 'Eredeti').expect(201);

        const response = await moderate(intruder, post.id, comment.id).expect(403);
        await moderate(commenter, post.id, comment.id).expect(403);

        expect(response.body.errors[0].message).toEqual('Ehhez nincs jogosultságod');
        const { comments } = await getDetail(postAuthor, post.id);
        expect(comments[0].body).toEqual('Eredeti');
        expect(comments[0].moderated).toBe(false);
    });

    it('does not let the author of another post moderate through their own post', async () => {
        const postAuthor = await global.signin('author@test.com');
        const otherAuthor = await global.signin('other@test.com');
        const post = await createPost(postAuthor, 'Egyik');
        const ownPost = await createPost(otherAuthor, 'Másik');
        const { body: comment } = await addComment(postAuthor, post.id, 'Eredeti').expect(201);

        await moderate(otherAuthor, ownPost.id, comment.id).expect(404);

        const { comments } = await getDetail(postAuthor, post.id);
        expect(comments[0].body).toEqual('Eredeti');
    });

    it('does not let the author edit a moderated comment', async () => {
        const postAuthor = await global.signin('author@test.com');
        const commenter = await global.signin('commenter@test.com');
        const post = await createPost(postAuthor);
        const { body: comment } = await addComment(commenter, post.id, 'Eredeti').expect(201);
        await moderate(postAuthor, post.id, comment.id).expect(200);

        await request(app)
            .put(`/api/posts/${post.id}/comments/${comment.id}`)
            .set('Cookie', commenter)
            .send({ body: 'Visszaírva' })
            .expect(403);

        const { comments } = await getDetail(commenter, post.id);
        expect(comments[0].body).toEqual(MODERATED_COMMENT_TEXT);
    });

    it('returns 404 for a missing or invalid comment', async () => {
        const cookie = await global.signin();
        const post = await createPost(cookie);

        await moderate(cookie, post.id, '000000000000000000000000').expect(404);
        await moderate(cookie, post.id, 'nem-letezik').expect(404);
        await moderate(cookie, 'nem-letezik', '000000000000000000000000').expect(404);
    });
});
