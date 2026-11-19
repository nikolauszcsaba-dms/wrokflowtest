import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth';
import Avatar from './Avatar';

const UserMenu = () => {
    const { user, signout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleClick = (event) => {
            if (!ref.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleKey = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    const handleProfile = () => {
        setOpen(false);
        navigate('/profile');
    };

    const handleSignout = async () => {
        setOpen(false);
        await signout();
        navigate('/signin', { replace: true });
    };

    return (
        <div className="user-menu" ref={ref}>
            <button
                type="button"
                className="user-chip"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                <Avatar url={user.avatarUrl} />
                <span className="user-email">{user.email}</span>
                <span className="caret" aria-hidden="true">▾</span>
            </button>
            {open && (
                <div className="dropdown" role="menu">
                    <button type="button" role="menuitem" className="dropdown-item" onClick={handleProfile}>
                        Profil szerkesztése
                    </button>
                    <hr className="dropdown-separator" />
                    <button type="button" role="menuitem" className="dropdown-item" onClick={handleSignout}>
                        Kijelentkezés
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
