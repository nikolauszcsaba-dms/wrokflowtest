import request from 'supertest';
import { app } from '../../app';

it('clears the cookie after signing out', async () => {
    const cookie = await global.signin();

    const response = await request(app)
        .post('/api/users/signout')
        .set('Cookie', cookie)
        .send({})
        .expect(200);

    const setCookie = response.get('Set-Cookie');

    expect(setCookie).toBeDefined();
    expect(setCookie![0]).toMatch(/^session=;/);
});
