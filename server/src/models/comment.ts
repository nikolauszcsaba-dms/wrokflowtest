import mongoose from 'mongoose';
import { toAuthorView } from './author';

interface CommentAttrs {
    post: string;
    author: string;
    body: string;
    parent?: string | null;
}

interface CommentDoc extends mongoose.Document {
    id: string;
    post: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    body: string;
    parent: mongoose.Types.ObjectId | null;
    moderated: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface CommentModel extends mongoose.Model<CommentDoc> {
    build(attrs: CommentAttrs): CommentDoc;
}

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
    },
    moderated: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            const { _id, __v, post, author, parent, ...rest } = ret;

            return {
                id: _id,
                postId: post.toString(),
                ...rest,
                parentId: parent ? parent.toString() : null,
                author: toAuthorView(author),
            };
        },
    },
});

commentSchema.statics.build = (attrs: CommentAttrs) => {
    return new Comment(attrs);
};

const Comment = mongoose.model<CommentDoc, CommentModel>('Comment', commentSchema);

export { Comment };
