import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth';

const Layout = () => {
    const { user, signout } = useAuth();
    const navigate = useNavigate();

    const handleSignout = async () => {
        await signout();
        navigate('/signin', { replace: true });
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-title">Workflow teszt</div>
                <nav>
                    <NavLink to="/dashboard" className="menu-item">Dashboard</NavLink>
                </nav>
            </aside>
            <div className="main">
                <header className="topbar">
                    <span className="user-chip">
                        <span className="avatar" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c1.6-3.6 4.4-5.5 8-5.5S18.4 16.4 20 20" />
                            </svg>
                        </span>
                        <span className="user-email">{user.email}</span>
                    </span>
                    <button type="button" className="btn btn-secondary" onClick={handleSignout}>
                        Kijelentkezés
                    </button>
                </header>
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
