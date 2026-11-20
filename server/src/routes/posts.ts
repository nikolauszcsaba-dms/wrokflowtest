import express, { type Request, type Response } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';

import { BadRequestError } from '../errors/bad-request-error';
import { ForbiddenError } from '../errors/forbidden-error';
import { NotFoundError } from '../errors/not-found-error';
import { currentUser } from '../middlewares/current-user';
import { requireAuth } from '../middlewares/require-auth';
import { validateRequest } from '../middlewares/validate-request';
import { Comment } from '../models/comment';
import { Post } from '../models/post';
import { excerpt } from '../services/excerpt';

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 10000;
export const MAX_COMMENT_LENGTH = 2000;
export const MODERATED_COMMENT_TEXT = 'A post írója által moderálva';

const router = express.Router();

const isId = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);

const findPost = async (id: unknown) => {
    const post = isId(id) ? await Post.findById(id).populate('author', 'email') : null;

    if (!post) {
        throw new NotFoundError();
    }

    return post;
};

const findOwnPost = async (id: unknown, userId: string) => {
    const post = isId(id) ? await Post.findById(id) : null;

    if (!post) {
        throw new NotFoundError();
    }

    if (post.author.toString() !== userId) {
        throw new ForbiddenError();
    }

    return post;
};

const findComment = async (postId: unknown, commentId: unknown) => {
    const comment = isId(postId) && isId(commentId)
        ? await Comment.findOne({ _id: commentId, post: postId })
        : null;

    if (!comment) {
        throw new NotFoundError();
    }

    return comment;
};

const postFields = [
    body('title')
        .isString()
        .withMessage('A cím megadása kötelező')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('A cím megadása kötelező')
        .bail()
        .isLength({ max: MAX_TITLE_LENGTH })
        .withMessage(`A cím legfeljebb ${MAX_TITLE_LENGTH} karakter lehet`),
    body('description')
        .isString()
        .withMessage('A leírás megadása kötelező')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('A leírás megadása kötelező')
        .bail()
        .isLength({ max: MAX_DESCRIPTION_LENGTH })
        .withMessage(`A leírás legfeljebb ${MAX_DESCRIPTION_LENGTH} karakter lehet`),
];

const commentBody = body('body')
    .isString()
    .withMessage('A komment szövege kötelező')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('A komment szövege kötelező')
    .bail()
    .isLength({ max: MAX_COMMENT_LENGTH })
    .withMessage(`A komment legfeljebb ${MAX_COMMENT_LENGTH} karakter lehet`);

router.get('/api/posts', currentUser, requireAuth, async (_req: Request, res: Response) => {
    const posts = await Post.find().sort({ createdAt: -1, _id: -1 }).populate('author', 'email');

    res.send(posts.map((post) => {
        const { description, ...rest } = post.toJSON() as unknown as Record<string, unknown>;
        return { ...rest, excerpt: excerpt(post.description) };
    }));
});

router.post(
    '/api/posts',
    currentUser,
    requireAuth,
    postFields,
    validateRequest,
    async (req: Request, res: Response) => {
        const { title, description } = req.body;

        const post = Post.build({ title, description, author: req.currentUser!.id });
        await post.save();
        await post.populate('author', 'email');

        res.status(201).send(post);
    }
);

router.put(
    '/api/posts/:id',
    currentUser,
    requireAuth,
    postFields,
    validateRequest,
    async (req: Request, res: Response) => {
        const post = await findOwnPost(req.params.id, req.currentUser!.id);
        const { title, description } = req.body;

        post.set({ title, description, editedAt: new Date() });
        await post.save();
        await post.populate('author', 'email');

        res.send(post);
    }
);

router.get('/api/posts/:id', currentUser, requireAuth, async (req: Request, res: Response) => {
    const post = await findPost(req.params.id);
    const comments = await Comment.find({ post: post._id })
        .sort({ createdAt: 1, _id: 1 })
        .populate('author', 'email');

    res.send({ post, comments });
});

router.post(
    '/api/posts/:id/comments',
    currentUser,
    requireAuth,
    [
        commentBody,
        body('parentId')
            .optional({ values: 'null' })
            .custom(isId)
            .withMessage('Az előzmény komment nem található'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const post = await findPost(req.params.id);
        const { body: text, parentId } = req.body;

        if (parentId) {
            const parent = await Comment.findById(parentId);

            if (!parent || !parent.post.equals(post._id as mongoose.Types.ObjectId)) {
                throw new BadRequestError('Az előzmény komment nem található');
            }
        }

        const comment = Comment.build({
            post: post.id,
            author: req.currentUser!.id,
            body: text,
            parent: parentId ?? null,
        });
        await comment.save();
        await comment.populate('author', 'email');

        res.status(201).send(comment);
    }
);

router.put(
    '/api/posts/:id/comments/:commentId',
    currentUser,
    requireAuth,
    [commentBody],
    validateRequest,
    async (req: Request, res: Response) => {
        const comment = await findComment(req.params.id, req.params.commentId);

        if (comment.author.toString() !== req.currentUser!.id || comment.moderated) {
            throw new ForbiddenError();
        }

        comment.set('body', req.body.body);
        await comment.save();
        await comment.populate('author', 'email');

        res.send(comment);
    }
);

router.post(
    '/api/posts/:id/comments/:commentId/moderate',
    currentUser,
    requireAuth,
    async (req: Request, res: Response) => {
        const comment = await findComment(req.params.id, req.params.commentId);
        await findOwnPost(req.params.id, req.currentUser!.id);

        comment.set({ body: MODERATED_COMMENT_TEXT, moderated: true });
        await comment.save();
        await comment.populate('author', 'email');

        res.send(comment);
    }
);

export { router as postsRouter };
