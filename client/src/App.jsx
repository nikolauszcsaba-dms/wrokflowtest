import { Navigate, Route, Routes } from 'react-router';

import { useAuth } from './auth';
import Layout from './components/Layout';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

const RequireAuth = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return user ? children : <Navigate to="/signin" replace />;
};

const GuestOnly = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return user ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => (
    <Routes>
        <Route path="/signin" element={<GuestOnly><SignIn /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><SignUp /></GuestOnly>} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
);

export default App;
