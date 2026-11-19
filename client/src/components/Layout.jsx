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
                    <span className="user-email">{user.email}</span>
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
