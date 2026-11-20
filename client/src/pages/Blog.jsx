import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api';
import { createPost, formatDate, listPosts } from '../blog';

const toErrors = (err) => (err instanceof ApiError ? err.errors : [{ message: 'Váratlan hiba történt' }]);

const Errors = ({ errors }) => errors.length > 0 && (
    <ul className="errors" role="alert">
        {errors.map((err) => (
            <li key={err.message}>{err.message}</li>
        ))}
    </ul>
);

const NewPostForm = ({ onCreated }) => {
    const [values, setValues] = useState({ title: '', description: '' });
    const [errors, setErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSubmitting(true);
        try {
            onCreated(await createPost(values));
            setValues({ title: '', description: '' });
        } catch (err) {
            setErrors(toErrors(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="card blog-form" onSubmit={handleSubmit}>
            <h2>Új post</h2>
            <label htmlFor="post-title">Cím</label>
            <input
                id="post-title"
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
                maxLength={200}
                required
            />
            <label htmlFor="post-description">Leírás</label>
            <textarea
                id="post-description"
                rows={5}
                value={values.description}
                onChange={(e) => setValues({ ...values, description: e.target.value })}
                maxLength={10000}
                required
            />
            <Errors errors={errors} />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
                Post létrehozása
            </button>
        </form>
    );
};

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        listPosts()
            .then(setPosts)
            .catch((err) => setErrors(toErrors(err)))
            .finally(() => setLoading(false));
    }, []);

    const handleCreated = () => listPosts().then(setPosts).catch((err) => setErrors(toErrors(err)));

    return (
        <>
            <h1>Blog</h1>
            <div className="blog">
                <NewPostForm onCreated={handleCreated} />
                <Errors errors={errors} />
                {!loading && posts.length === 0 && errors.length === 0 && (
                    <p className="hint">Még nincs post.</p>
                )}
                <ul className="post-list">
                    {posts.map((post) => (
                        <li key={post.id} className="card post-item">
                            <div className="post-item-header">
                                <h2>{post.title}</h2>
                                <time className="post-meta" dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                            </div>
                            <p className="post-excerpt">{post.excerpt}</p>
                            <Link to={`/blog/${post.id}`} className="btn btn-secondary">Megnyitás</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default Blog;
