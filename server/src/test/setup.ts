import os from 'node:os';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app';

declare global {
    var signin: () => Promise<string[]>;
}

let mongo: MongoMemoryServer;

beforeAll(async () => {
    process.env.JWT_KEY = 'asdfasdf';

    mongo = await MongoMemoryServer.create();

    await mongoose.connect(mongo.getUri(), {
        runtimeAdapters: { os },
    });
});

beforeEach(async () => {
    const db = mongoose.connection.db;

    if (!db) {
        throw new Error('MongoDB connection is not established');
    }

    const collections = await db.collections();

    await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
    await mongoose.connection.close();
    if (mongo) {
        await mongo.stop();
    }
});

global.signin = async () => {
    const response = await request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'password',
        })
        .expect(201);

    const cookie = response.get('Set-Cookie');

    if (!cookie) {
        throw new Error('Cookie not set after signup');
    }

    return cookie;
};
