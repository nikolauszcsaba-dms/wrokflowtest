import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from './api';

const AuthContext = createContext(null);

const loadUser = async () => {
    const { currentUser } = await apiRequest('GET', '/api/users/currentuser');

    return currentUser ? apiRequest('GET', '/api/users/profile') : null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const signin = async (email, password) => {
        const data = await apiRequest('POST', '/api/users/signin', { email, password });
        setUser(data);
    };

    const signup = async (email, password) => {
        const data = await apiRequest('POST', '/api/users/signup', { email, password });
        setUser(data);
    };

    const signout = async () => {
        await apiRequest('POST', '/api/users/signout', {});
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signin, signup, signout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
