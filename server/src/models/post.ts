import mongoose from 'mongoose';
import { toAuthorView } from './author';

interface PostAttrs {
    title: string;
    description: string;
    author: string;
}

interface PostDoc extends mongoose.Document {
    id: string;
    title: string;
    description: string;
    author: mongoose.Types.ObjectId;
    createdAt: Date;
    editedAt: Date | null;
}

interface PostModel extends mongoose.Model<PostDoc> {
    build(attrs: PostAttrs): PostDoc;
}

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date(),
        immutable: true,
    },
    editedAt: {
        type: Date,
        default: null,
    },
}, {
    toJSON: {
        transform(_doc, ret) {
            const { _id, __v, author, ...rest } = ret;

            return { id: _id, ...rest, author: toAuthorView(author) };
        },
    },
});

postSchema.statics.build = (attrs: PostAttrs) => {
    return new Post(attrs);
};

const Post = mongoose.model<PostDoc, PostModel>('Post', postSchema);

export { Post };
