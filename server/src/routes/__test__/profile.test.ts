import request from 'supertest';
import { app } from '../../app';

it('returns 401 if not authenticated', async () => {
    await request(app)
        .get('/api/users/profile')
        .send()
        .expect(401);
});

it('returns the profile of the current user without the password', async () => {
    const cookie = await global.signin();

    const response = await request(app)
        .get('/api/users/profile')
        .set('Cookie', cookie)
        .send()
        .expect(200);

    expect(response.body.email).toEqual('test@test.com');
    expect(response.body.password).toBeUndefined();
    expect(response.body.avatarUrl).toBeNull();
});
