import { useState } from 'react';
import { ApiError, apiRequest, apiUpload } from '../api';
import { useAuth } from '../auth';
import Avatar from '../components/Avatar';

const MAX_AVATAR_BYTES = 1024 * 1024;

const toErrors = (err) => (err instanceof ApiError ? err.errors : [{ message: 'Váratlan hiba történt' }]);

const Messages = ({ errors, success }) => (
    <>
        {errors.length > 0 && (
            <ul className="errors" role="alert">
                {errors.map((err) => (
                    <li key={err.message}>{err.message}</li>
                ))}
            </ul>
        )}
        {success && <p className="success" role="status">{success}</p>}
    </>
);

const AvatarForm = () => {
    const { user, setUser } = useAuth();
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSuccess('');

        if (file.size > MAX_AVATAR_BYTES) {
            setErrors([{ message: 'A kép legfeljebb 1 MB lehet' }]);
            return;
        }

        setSubmitting(true);
        try {
            setUser(await apiUpload('PUT', '/api/users/avatar', file));
            setFile(null);
            event.target.reset();
            setSuccess('A profilkép elmentve.');
        } catch (err) {
            setErrors(toErrors(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="card profile-form profile-avatar" onSubmit={handleSubmit}>
            <h2>Profilkép</h2>
            <div className="avatar-row">
                <Avatar url={user.avatarUrl} size="large" />
                <input
                    id="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    aria-label="Profilkép"
                    onChange={(e) => setFile(e.target.files[0] ?? null)}
                />
            </div>
            <p className="hint">PNG, JPEG, WebP vagy GIF, legfeljebb 1 MB.</p>
            <Messages errors={errors} success={success} />
            <button type="submit" className="btn btn-primary" disabled={!file || submitting}>
                Feltöltés
            </button>
        </form>
    );
};

const PasswordForm = () => {
    const [values, setValues] = useState({
        currentPassword: '',
        newPassword: '',
        newPasswordConfirmation: '',
    });
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const field = (name) => ({
        id: name,
        type: 'password',
        value: values[name],
        onChange: (e) => setValues({ ...values, [name]: e.target.value }),
        required: true,
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSuccess('');

        if (values.newPassword !== values.newPasswordConfirmation) {
            setErrors([{ message: 'Az új jelszó és a megerősítése nem egyezik' }]);
            return;
        }

        setSubmitting(true);
        try {
            await apiRequest('PUT', '/api/users/password', values);
            setValues({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' });
            setSuccess('A jelszó megváltozott.');
        } catch (err) {
            setErrors(toErrors(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="card profile-form profile-password" onSubmit={handleSubmit}>
            <h2>Jelszó módosítása</h2>
            <label htmlFor="currentPassword">Jelenlegi jelszó</label>
            <input {...field('currentPassword')} autoComplete="current-password" />
            <label htmlFor="newPassword">Új jelszó</label>
            <input {...field('newPassword')} autoComplete="new-password" />
            <label htmlFor="newPasswordConfirmation">Új jelszó megerősítése</label>
            <input {...field('newPasswordConfirmation')} autoComplete="new-password" />
            <Messages errors={errors} success={success} />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
                Jelszó módosítása
            </button>
        </form>
    );
};

const Profile = () => {
    const { user } = useAuth();

    return (
        <>
            <h1>Profil szerkesztése</h1>
            <div className="profile">
                <section className="card profile-form profile-data">
                    <h2>Adatok</h2>
                    <label htmlFor="email">E-mail-cím</label>
                    <input id="email" type="email" value={user.email} readOnly disabled />
                    <p className="hint">Az e-mail-cím nem módosítható.</p>
                </section>
                <PasswordForm />
                <AvatarForm />
            </div>
        </>
    );
};

export default Profile;
