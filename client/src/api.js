export class ApiError extends Error {
    constructor(errors) {
        super(errors.map((e) => e.message).join(', '));
        this.errors = errors;
    }
}

const send = async (method, url, headers, body) => {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers,
        body,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(data.errors ?? [{ message: 'Váratlan hiba történt' }]);
    }

    return data;
};

export const apiRequest = (method, url, body) => send(
    method,
    url,
    body ? { 'Content-Type': 'application/json' } : undefined,
    body ? JSON.stringify(body) : undefined
);

export const apiUpload = (method, url, file) => send(
    method,
    url,
    { 'Content-Type': file.type || 'application/octet-stream' },
    file
);
