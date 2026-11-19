import express, { type Request, type Response, type NextFunction } from 'express';

import { BadRequestError } from '../errors/bad-request-error';
import { NotAuthorizedError } from '../errors/not-authorized-error';
import { NotFoundError } from '../errors/not-found-error';
import { currentUser } from '../middlewares/current-user';
import { requireAuth } from '../middlewares/require-auth';
import { detectImageType } from '../services/image-type';
import { User } from '../models/user';

export const MAX_AVATAR_BYTES = 1024 * 1024;

const router = express.Router();

const rawImage = express.raw({ type: () => true, limit: MAX_AVATAR_BYTES });

const readImage = (req: Request, res: Response, next: NextFunction) => {
    rawImage(req, res, (err?: unknown) => {
        if (err && (err as { type?: string }).type === 'entity.too.large') {
            return next(new BadRequestError('Image must be at most 1 MB'));
        }
        next(err);
    });
};

router.get('/api/users/avatar', currentUser, requireAuth, async (req: Request, res: Response) => {
    const user = await User.findById(req.currentUser!.id);

    if (!user?.avatar) {
        throw new NotFoundError();
    }

    res.set({
        'Content-Type': user.avatar.contentType,
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
    });
    res.send(user.avatar.data);
});

router.put(
    '/api/users/avatar',
    currentUser,
    requireAuth,
    readImage,
    async (req: Request, res: Response) => {
        const data = Buffer.isBuffer(req.body) ? req.body : null;
        const contentType = data ? detectImageType(data) : null;

        if (!data || !contentType) {
            throw new BadRequestError('Image must be a PNG, JPEG, WebP or GIF file');
        }

        const user = await User.findById(req.currentUser!.id);

        if (!user) {
            throw new NotAuthorizedError();
        }

        user.set('avatar', { data, contentType, updatedAt: new Date() });
        await user.save();

        res.send(user);
    }
);

export { router as avatarRouter };
