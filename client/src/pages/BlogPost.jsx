import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api';
import { useAuth } from '../auth';
import {
    addComment,
    canEditComment,
    commentAnchor,
    formatDate,
    getPost,
    isEdited,
    replaceComment,
    updateComment,
} from '../blog';

const toErrors = (err) => (err instanceof ApiError ? err.errors : [{ message: 'Váratlan hiba történt' }]);

const Errors = ({ errors }) => errors.length > 0 && (
    <ul className="errors" role="alert">
        {errors.map((err) => (
            <li key={err.message}>{err.message}</li>
        ))}
    </ul>
);

const CommentForm = ({ postId, replyTo, onCancelReply, onCreated }) => {
    const [body, setBody] = useState('');
    const [errors, setErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSubmitting(true);
        try {
            onCreated(await addComment(postId, body, replyTo?.id ?? null));
            setBody('');
        } catch (err) {
            setErrors(toErrors(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form id="comment-form" className="card blog-form" onSubmit={handleSubmit}>
            <h2>Új komment</h2>
            {replyTo && (
                <p className="reply-to">
                    Válasz neki: <strong>{replyTo.author.email}</strong>
                    <button type="button" className="link-button" onClick={onCancelReply}>Mégse</button>
                </p>
            )}
            <label htmlFor="comment-body">Komment</label>
            <textarea
                id="comment-body"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                required
            />
            <Errors errors={errors} />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
                Küldés
            </button>
        </form>
    );
};

const CommentEditor = ({ postId, comment, onSaved, onCancel }) => {
    const [body, setBody] = useState(comment.body);
    const [errors, setErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSubmitting(true);
        try {
            onSaved(await updateComment(postId, comment.id, body));
        } catch (err) {
            setErrors(toErrors(err));
            setSubmitting(false);
        }
    };

    return (
        <form className="comment-editor" onSubmit={handleSubmit}>
            <textarea
                aria-label="Komment szerkesztése"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                required
            />
            <Errors errors={errors} />
            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>Mentés</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Mégse</button>
            </div>
        </form>
    );
};

const CommentItem = ({ postId, comment, parent, highlighted, onShowParent, onReply, onSaved }) => {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);

    return (
        <li id={commentAnchor(comment.id)} className={highlighted ? 'comment comment-highlighted' : 'comment'}>
            <div className="comment-header">
                <span className="comment-meta">
                    <strong>{comment.author.email}</strong>
                    {' · '}
                    <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                    {isEdited(comment) && ' · szerkesztve'}
                </span>
                {comment.parentId && (
                    <a
                        className="comment-parent-link"
                        href={`#${commentAnchor(comment.parentId)}`}
                        onClick={(event) => {
                            event.preventDefault();
                            onShowParent(comment.parentId);
                        }}
                    >
                        Előzmény{parent ? `: ${parent.author.email}` : ''}
                    </a>
                )}
            </div>
            {editing ? (
                <CommentEditor
                    postId={postId}
                    comment={comment}
                    onCancel={() => setEditing(false)}
                    onSaved={(updated) => {
                        setEditing(false);
                        onSaved(updated);
                    }}
                />
            ) : (
                <>
                    <p className="comment-body">{comment.body}</p>
                    <div className="comment-actions">
                        <button type="button" className="link-button" onClick={() => onReply(comment)}>Válasz</button>
                        {canEditComment(comment, user) && (
                            <button type="button" className="link-button" onClick={() => setEditing(true)}>Szerkesztés</button>
                        )}
                    </div>
                </>
            )}
        </li>
    );
};

const BlogPost = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [errors, setErrors] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [highlighted, setHighlighted] = useState(null);
    const highlightTimer = useRef(null);

    useEffect(() => {
        setPost(null);
        setErrors([]);
        getPost(id)
            .then((data) => {
                setPost(data.post);
                setComments(data.comments);
            })
            .catch((err) => setErrors(toErrors(err)));
    }, [id]);

    useEffect(() => () => clearTimeout(highlightTimer.current), []);

    const showComment = (commentId) => {
        document.getElementById(commentAnchor(commentId))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlighted(commentId);
        clearTimeout(highlightTimer.current);
        highlightTimer.current = setTimeout(() => setHighlighted(null), 2000);
    };

    const handleReply = (comment) => {
        setReplyTo(comment);
        document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('comment-body')?.focus({ preventScroll: true });
    };

    const byId = new Map(comments.map((c) => [c.id, c]));

    return (
        <>
            <p><Link to="/blog" className="back-link">← Vissza a listához</Link></p>
            <Errors errors={errors} />
            {post && (
                <div className="blog">
                    <article className="card post-detail">
                        <h1>{post.title}</h1>
                        <p className="post-meta">
                            {post.author.email} · <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                        </p>
                        <p className="post-description">{post.description}</p>
                    </article>
                    <section className="comments">
                        <h2>Kommentek ({comments.length})</h2>
                        {comments.length === 0 && <p className="hint">Még nincs komment.</p>}
                        <ul className="comment-list">
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    postId={post.id}
                                    comment={comment}
                                    parent={comment.parentId ? byId.get(comment.parentId) : null}
                                    highlighted={highlighted === comment.id}
                                    onShowParent={showComment}
                                    onReply={handleReply}
                                    onSaved={(updated) => setComments((list) => replaceComment(list, updated))}
                                />
                            ))}
                        </ul>
                    </section>
                    <CommentForm
                        postId={post.id}
                        replyTo={replyTo}
                        onCancelReply={() => setReplyTo(null)}
                        onCreated={(comment) => {
                            setComments((list) => [...list, comment]);
                            setReplyTo(null);
                        }}
                    />
                </div>
            )}
        </>
    );
};

export default BlogPost;
