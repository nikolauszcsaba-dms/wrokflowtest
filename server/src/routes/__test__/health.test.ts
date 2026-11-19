import request from 'supertest';
import { app } from '../../app';

it('reports ok when the database is connected', async () => {
    const response = await request(app)
        .get('/api/health')
        .expect(200);

    expect(response.body.status).toEqual('ok');
});

it('returns 404 for an unknown api route', async () => {
    await request(app)
        .get('/api/does-not-exist')
        .expect(404);
});
