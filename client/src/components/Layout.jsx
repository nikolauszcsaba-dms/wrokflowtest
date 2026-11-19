import { NavLink, Outlet } from 'react-router';
import UserMenu from './UserMenu';

const Layout = () => (
    <div className="layout">
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="sidebar-title">Workflow teszt</span>
            </div>
            <nav>
                <NavLink to="/dashboard" className="menu-item">Dashboard</NavLink>
            </nav>
        </aside>
        <div className="main">
            <header className="topbar">
                <UserMenu />
            </header>
            <main className="content">
                <Outlet />
            </main>
        </div>
    </div>
);

export default Layout;
