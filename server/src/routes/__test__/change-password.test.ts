import request from 'supertest';
import { app } from '../../app';

const changePassword = (cookie: string[] | undefined, body: object) => {
    const req = request(app).put('/api/users/password');

    if (cookie) {
        req.set('Cookie', cookie);
    }

    return req.send(body);
};

const validBody = {
    currentPassword: 'password',
    newPassword: 'newpassword',
    newPasswordConfirmation: 'newpassword',
};

it('returns 401 if not authenticated', async () => {
    await changePassword(undefined, validBody).expect(401);
});

it('rejects an incorrect current password', async () => {
    const cookie = await global.signin();

    const response = await changePassword(cookie, {
        ...validBody,
        currentPassword: 'wrongpassword',
    }).expect(400);

    expect(response.body.errors[0].message).toEqual('A jelenlegi jelszó hibás');
});
it('rejects a missing current password', async () => {
    const cookie = await global.signin();

    await changePassword(cookie, {
        newPassword: 'newpassword',
        newPasswordConfirmation: 'newpassword',
    }).expect(400);
});

it('rejects a confirmation that does not match', async () => {
    const cookie = await global.signin();

    const response = await changePassword(cookie, {
        ...validBody,
        newPasswordConfirmation: 'otherpassword',
    }).expect(400);

    expect(response.body.errors[0].field).toEqual('newPasswordConfirmation');
});

it('rejects a new password that is too short', async () => {
    const cookie = await global.signin();

    await changePassword(cookie, {
        ...validBody,
        newPassword: 'p',
        newPasswordConfirmation: 'p',
    }).expect(400);
});

it('changes the password so only the new one works for signin', async () => {
    const cookie = await global.signin();

    await changePassword(cookie, validBody).expect(200);

    await request(app)
        .post('/api/users/signin')
        .send({ email: 'test@test.com', password: 'password' })
        .expect(400);

    await request(app)
        .post('/api/users/signin')
        .send({ email: 'test@test.com', password: 'newpassword' })
        .expect(200);
});

it('keeps the old password if the change is rejected', async () => {
    const cookie = await global.signin();

    await changePassword(cookie, {
        ...validBody,
        newPasswordConfirmation: 'otherpassword',
    }).expect(400);

    await request(app)
        .post('/api/users/signin')
        .send({ email: 'test@test.com', password: 'password' })
        .expect(200);
});
