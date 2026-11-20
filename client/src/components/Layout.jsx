import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import UserMenu from './UserMenu';

const Layout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const handleKey = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [menuOpen]);

    return (
        <div className="layout">
            <aside id="sidebar" className={menuOpen ? 'sidebar sidebar-open' : 'sidebar'}>
                <div className="sidebar-logo">
                    <span className="sidebar-title">Workflow teszt</span>
                </div>
                <nav>
                    <NavLink to="/dashboard" className="menu-item" onClick={closeMenu}>Dashboard</NavLink>
                    <NavLink to="/blog" className="menu-item" onClick={closeMenu}>Blog</NavLink>
                </nav>
            </aside>
            {menuOpen && <div className="sidebar-backdrop" aria-hidden="true" onClick={closeMenu} />}
            <div className="main">
                <header className="topbar">
                    <button
                        type="button"
                        className="menu-toggle"
                        aria-label="Menü"
                        aria-controls="sidebar"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((value) => !value)}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
                        </svg>
                    </button>
                    <UserMenu />
                </header>
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
