import mongoose from 'mongoose';
import { Password } from '../services/password';

interface UserAttrs {
    email: string;
    password: string;
}

interface UserModel extends mongoose.Model<UserDoc> {
    build(attrs: UserAttrs): UserDoc;
}

interface Avatar {
    data: Buffer;
    contentType: string;
    updatedAt: Date;
}

interface UserDoc extends mongoose.Document {
    id: string;
    email: string;
    password: string;
    avatar?: Avatar;
}

const avatarSchema = new mongoose.Schema({
    data: {
        type: Buffer,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: avatarSchema,
        required: false,
    },
}, {
    toJSON: {
        transform(_doc, ret) {
            const { _id, __v, password, avatar, ...rest } = ret;
            const avatarUrl = avatar?.updatedAt
                ? `/api/users/avatar?v=${new Date(avatar.updatedAt).getTime()}`
                : null;

            return { id: _id, ...rest, avatarUrl };
        },
    },
});

userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        const hashed = await Password.toHash(this.get('password'));
        this.set('password', hashed);
    }
});

userSchema.statics.build = (attrs: UserAttrs) => {
    return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
