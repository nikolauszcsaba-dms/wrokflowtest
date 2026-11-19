import { useState } from 'react';
import { ApiError } from '../api';

const AuthForm = ({ title, buttonLabel, onSubmit, footer }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSubmitting(true);

        try {
            await onSubmit(email, password);
        } catch (err) {
            setErrors(err instanceof ApiError ? err.errors : [{ message: 'Váratlan hiba történt' }]);
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>{title}</h1>
                <label htmlFor="email">E-mail-cím</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <label htmlFor="password">Jelszó</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {errors.length > 0 && (
                    <ul className="errors" role="alert">
                        {errors.map((err) => (
                            <li key={err.message}>{err.message}</li>
                        ))}
                    </ul>
                )}
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {buttonLabel}
                </button>
                <div className="auth-footer">{footer}</div>
            </form>
        </div>
    );
};

export default AuthForm;
