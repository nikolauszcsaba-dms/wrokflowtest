export class ApiError extends Error {
    constructor(errors) {
        super(errors.map((e) => e.message).join(', '));
        this.errors = errors;
    }
}

export const apiRequest = async (method, url, body) => {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(data.errors ?? [{ message: 'Váratlan hiba történt' }]);
    }

    return data;
};
