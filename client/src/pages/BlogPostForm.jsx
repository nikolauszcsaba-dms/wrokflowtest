import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api';
import { useAuth } from '../auth';
import { canEditPost, createPost, getPost, updatePost } from '../blog';

const toErrors = (err) => (err instanceof ApiError ? err.errors : [{ message: 'Váratlan hiba történt' }]);

const Errors = ({ errors }) => errors.length > 0 && (
    <ul className="errors" role="alert">
        {errors.map((err) => (
            <li key={err.message}>{err.message}</li>
        ))}
    </ul>
);

const BlogPostForm = () => {
    const { id } = useParams();
    const editing = Boolean(id);
    const { user } = useAuth();
    const userId = user?.id;
    const navigate = useNavigate();
    const [values, setValues] = useState({ title: '', description: '' });
    const [ready, setReady] = useState(!editing);
    const [errors, setErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!editing) {
            return;
        }
        setReady(false);
        setErrors([]);
        getPost(id)
            .then(({ post }) => {
                if (!canEditPost(post, { id: userId })) {
                    setErrors([{ message: 'Ehhez nincs jogosultságod' }]);
                    return;
                }
                setValues({ title: post.title, description: post.description });
                setReady(true);
            })
            .catch((err) => setErrors(toErrors(err)));
    }, [editing, id, userId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSubmitting(true);
        try {
            const post = editing ? await updatePost(id, values) : await createPost(values);
            navigate(`/blog/${post.id}`);
        } catch (err) {
            setErrors(toErrors(err));
            setSubmitting(false);
        }
    };

    const backTo = editing ? `/blog/${id}` : '/blog';

    return (
        <>
            <p><Link to={backTo} className="back-link">← {editing ? 'Vissza a posthoz' : 'Vissza a listához'}</Link></p>
            <h1>{editing ? 'Post szerkesztése' : 'Új post'}</h1>
            <div className="blog">
                {!ready && <Errors errors={errors} />}
                {ready && (
                    <form className="card blog-form" onSubmit={handleSubmit}>
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
                            rows={8}
                            value={values.description}
                            onChange={(e) => setValues({ ...values, description: e.target.value })}
                            maxLength={10000}
                            required
                        />
                        <Errors errors={errors} />
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {editing ? 'Mentés' : 'Post létrehozása'}
                            </button>
                            <Link to={backTo} className="btn btn-secondary">Mégse</Link>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
};

export default BlogPostForm;
