import express, { type Request, type Response } from 'express';

import { NotAuthorizedError } from '../errors/not-authorized-error';
import { currentUser } from '../middlewares/current-user';
import { requireAuth } from '../middlewares/require-auth';
import { User } from '../models/user';

const router = express.Router();

router.get('/api/users/profile', currentUser, requireAuth, async (req: Request, res: Response) => {
    const user = await User.findById(req.currentUser!.id);

    if (!user) {
        throw new NotAuthorizedError();
    }

    res.send(user);
});

export { router as profileRouter };
