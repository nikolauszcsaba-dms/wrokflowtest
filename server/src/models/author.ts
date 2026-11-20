import mongoose from 'mongoose';

export interface AuthorView {
    id: string;
    email: string | null;
}

// Only the id and the e-mail address of the author may leave the server.
export const toAuthorView = (author: unknown): AuthorView => {
    if (author && typeof author === 'object' && !(author instanceof mongoose.Types.ObjectId)) {
        const { id, _id, email } = author as { id?: unknown; _id?: unknown; email?: unknown };
        return {
            id: String(id ?? _id),
            email: typeof email === 'string' ? email : null,
        };
    }

    return { id: String(author), email: null };
};
