import mongoose from 'mongoose';
import { app } from './app';

const PORT = Number(process.env.PORT ?? 8080);
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/app';
const MAX_CONNECT_ATTEMPTS = 10;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async (attempt = 1, delay = INITIAL_RETRY_DELAY_MS): Promise<void> => {
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');
    } catch (err) {
        if (attempt >= MAX_CONNECT_ATTEMPTS) {
            console.error(`MongoDB connection failed after ${attempt} attempts, exiting`, err);
            process.exit(1);
        }
        console.error(`MongoDB connection attempt ${attempt} failed, retrying in ${delay} ms`, err);
        await sleep(delay);
        return connectWithRetry(attempt + 1, Math.min(delay * 2, MAX_RETRY_DELAY_MS));
    }
};

const start = async () => {
    if (!process.env.JWT_KEY) {
        throw new Error('JWT_KEY must be defined');
    }

    await connectWithRetry();

    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });
};

void start();
