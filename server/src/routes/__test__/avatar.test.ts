import request from 'supertest';
import { app } from '../../app';
import { MAX_AVATAR_BYTES } from '../avatar';

const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('rest-of-the-image'),
]);

const upload = (cookie: string[] | undefined, data: Buffer, contentType = 'image/png') => {
    const req = request(app)
        .put('/api/users/avatar')
        .set('Content-Type', contentType);

    if (cookie) {
        req.set('Cookie', cookie);
    }

    return req.send(data);
};

it('returns 401 when uploading without authentication', async () => {
    await upload(undefined, png).expect(401);
});

it('returns 401 when reading the avatar without authentication', async () => {
    await request(app)
        .get('/api/users/avatar')
        .send()
        .expect(401);
});

it('returns 404 if the user has no avatar', async () => {
    const cookie = await global.signin();

    await request(app)
        .get('/api/users/avatar')
        .set('Cookie', cookie)
        .send()
        .expect(404);
});

it('rejects a file that is not an image', async () => {
    const cookie = await global.signin();

    await upload(cookie, Buffer.from('<html>not an image</html>'), 'image/png').expect(400);
});

it('rejects an empty upload', async () => {
    const cookie = await global.signin();

    await upload(cookie, Buffer.alloc(0)).expect(400);
});

it('rejects an image larger than the limit', async () => {
    const cookie = await global.signin();
    const big = Buffer.concat([png, Buffer.alloc(MAX_AVATAR_BYTES)]);

    const response = await upload(cookie, big).expect(400);

    expect(response.body.errors[0].message).toEqual('Image must be at most 1 MB');
});

it('stores the avatar and returns it for the current user', async () => {
    const cookie = await global.signin();

    const uploadResponse = await upload(cookie, png).expect(200);

    expect(uploadResponse.body.avatarUrl).toMatch(/^\/api\/users\/avatar\?v=\d+$/);
    expect(uploadResponse.body.avatar).toBeUndefined();

    const avatarResponse = await request(app)
        .get(uploadResponse.body.avatarUrl)
        .set('Cookie', cookie)
        .buffer(true)
        .parse((res, callback) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

    expect(avatarResponse.headers['content-type']).toEqual('image/png');
    expect(Buffer.compare(avatarResponse.body, png)).toEqual(0);

    const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Cookie', cookie)
        .send()
        .expect(200);

    expect(profileResponse.body.avatarUrl).toEqual(uploadResponse.body.avatarUrl);
});

it('does not let the upload change the email', async () => {
    const cookie = await global.signin();

    await request(app)
        .put('/api/users/avatar')
        .set('Cookie', cookie)
        .send({ email: 'other@test.com' })
        .expect(400);

    const response = await request(app)
        .get('/api/users/profile')
        .set('Cookie', cookie)
        .send()
        .expect(200);

    expect(response.body.email).toEqual('test@test.com');
});
