import express from 'express';

import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middlewares/error-handler';
import { healthRouter } from './routes/health';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json());

app.use(healthRouter);

app.use(() => {
    throw new NotFoundError();
});

app.use(errorHandler);

export { app };
