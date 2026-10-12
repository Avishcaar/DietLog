import { createContext, useContext, useState, useEffect } from 'react';
import API from './api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setemail] = useState('');
    const [loading, setloading] = useState(true);


    useEffect(() => {
        API.get('/verify')
            .then(res => { setLoggedIn(res.data.loggedIn); if (res.data.loggedIn) setemail(res.data.user.email); setloading(false) })
            .catch(() => { setLoggedIn(false); setloading(false) });
    }, []);

    const login = (userEmail) => {
        setLoggedIn(true);
        if (userEmail) {
            setemail(userEmail);
        }
    };
    const logout = () => {
        setLoggedIn(false);
        setemail('');
    };

    return (
        <AuthContext.Provider value={{ loggedIn, login, logout, email, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
