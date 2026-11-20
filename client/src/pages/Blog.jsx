import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api';
import { formatDate, isPostEdited, listPosts } from '../blog';

const toErrors = (err) => (err instanceof ApiError ? err.errors : [{ message: 'Váratlan hiba történt' }]);

const Errors = ({ errors }) => errors.length > 0 && (
    <ul className="errors" role="alert">
        {errors.map((err) => (
            <li key={err.message}>{err.message}</li>
        ))}
    </ul>
);

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

    return (
        <>
            <div className="blog-header">
                <h1>Blog</h1>
                <Link to="/blog/new" className="btn btn-primary">Új felvitel</Link>
            </div>
            <div className="blog">
                <Errors errors={errors} />
                {!loading && posts.length === 0 && errors.length === 0 && (
                    <p className="hint">Még nincs post.</p>
                )}
                <ul className="post-list">
                    {posts.map((post) => (
                        <li key={post.id} className="card post-item">
                            <div className="post-item-header">
                                <h2>{post.title}</h2>
                                <span className="post-meta">
                                    <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                                    {isPostEdited(post) && ' · szerkesztve'}
                                </span>
                            </div>
                            <p className="post-excerpt">{post.excerpt}</p>
                            <Link to={`/blog/${post.id}`} className="post-more">Tovább...</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default Blog;
