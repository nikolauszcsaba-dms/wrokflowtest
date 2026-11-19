import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/api/health', (_req, res) => {
    const dbConnected = mongoose.connection.readyState === mongoose.ConnectionStates.connected;

    res.status(dbConnected ? 200 : 503).send({ status: dbConnected ? 'ok' : 'db-unavailable' });
});

export { router as healthRouter };
