import { apiRequest } from './api.js';

export const listPosts = () => apiRequest('GET', '/api/posts');

export const createPost = ({ title, description }) => apiRequest('POST', '/api/posts', { title, description });

export const getPost = (id) => apiRequest('GET', `/api/posts/${encodeURIComponent(id)}`);

export const addComment = (postId, body, parentId = null) => apiRequest(
    'POST',
    `/api/posts/${encodeURIComponent(postId)}/comments`,
    { body, parentId }
);

export const updateComment = (postId, commentId, body) => apiRequest(
    'PUT',
    `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
    { body }
);

// Only hides the button; the server decides whether the edit is allowed.
export const canEditComment = (comment, user) => Boolean(user?.id) && comment.author?.id === user.id;

export const isEdited = (comment) => new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime();

export const commentAnchor = (id) => `comment-${id}`;

export const formatDate = (value) => new Date(value).toLocaleString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

export const replaceComment = (comments, updated) => comments.map((c) => (c.id === updated.id ? updated : c));
