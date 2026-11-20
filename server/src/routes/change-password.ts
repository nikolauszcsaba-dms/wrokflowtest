import express, { type Request, type Response } from 'express';
import { body } from 'express-validator';

import { BadRequestError } from '../errors/bad-request-error';
import { NotAuthorizedError } from '../errors/not-authorized-error';
import { currentUser } from '../middlewares/current-user';
import { requireAuth } from '../middlewares/require-auth';
import { validateRequest } from '../middlewares/validate-request';
import { Password } from '../services/password';
import { User } from '../models/user';

const router = express.Router();

router.put(
    '/api/users/password',
    currentUser,
    requireAuth,
    [
        body('currentPassword')
            .isString()
            .notEmpty()
            .withMessage('You must supply your current password'),
        body('newPassword')
            .isString()
            .trim()
            .isLength({ min: 4, max: 20 })
            .withMessage('Password must be between 4 and 20 characters'),
        body('newPasswordConfirmation')
            .custom((value, { req }) => value === req.body.newPassword)
            .withMessage('Password confirmation does not match'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.currentUser!.id);

        if (!user) {
            throw new NotAuthorizedError();
        }

        const passwordsMatch = await Password.compare(user.password, currentPassword);

        if (!passwordsMatch) {
            throw new BadRequestError('A jelenlegi jelszó hibás');
        }

        user.password = newPassword;
        await user.save();

        res.send({});
    }
);

export { router as changePasswordRouter };
