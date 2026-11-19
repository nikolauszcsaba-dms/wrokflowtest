import path from 'node:path';
import express from 'express';
import cookieSession from 'cookie-session';

import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middlewares/error-handler';
import { currentUserRouter } from './routes/current-user';
import { healthRouter } from './routes/health';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json());
app.use(
    cookieSession({
        signed: false,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
    })
);

app.use(healthRouter);
app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

if (process.env.CLIENT_DIR) {
    const clientDir = path.resolve(process.env.CLIENT_DIR);

    app.use(express.static(clientDir));
    app.get(/^\/(?!api(\/|$)).*/, (_req, res) => {
        res.sendFile(path.join(clientDir, 'index.html'));
    });
}

app.use(() => {
    throw new NotFoundError();
});

app.use(errorHandler);

export { app };
