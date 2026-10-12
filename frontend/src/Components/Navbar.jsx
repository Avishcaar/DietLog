import { useAuth } from './authContext';
import { useState } from 'react';
import API from './api';
import './navbar.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';

export const Navbar = () => {
    const [openalert, setOpenalert] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const handleClosealert = () => setOpenalert(false);
    const handleOpenalert = () => setOpenalert(true);
    const { loggedIn, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        API.post('/logout', {}, { withCredentials: true })
            .then(() => {
                handleOpenalert();
                logout();
                navigate('/login');
            })
            .catch(() => {
                logout();
                navigate('/login');
            });
    };

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const navigationHandler = (path) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <header className="site-header">
                <Link to="/" className="brand" aria-label="HealthBot">
                    <span className="brand-mark">HB</span>
                    <span className="brand-title">HEALTHBOT<span className="cyan-dot">.</span></span>
                </Link>

                <nav className="site-nav" aria-label="Primary navigation">
                    <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
                    <a href="/#chat">Log Meal</a>
                    <a href="/#suggestions">Suggestions</a>
                    <Link to="/voice-companion" className={isActive('/voice-companion') ? 'active' : ''}>Health Companion</Link>
                    <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>Profile</Link>
                    
                    {loading ? (
                        <span className="nav-loading-indicator">...</span>
                    ) : loggedIn ? (
                        <button onClick={handleLogout} className="nav-action-btn logout">Log Out</button>
                    ) : (
                        <Link to="/login" className="nav-action-btn login">Sign In &rarr;</Link>
                    )}
                </nav>

                <div className="header-controls">
                    <button
                        className="icon-button hamburger-btn"
                        type="button"
                        onClick={toggleMobileMenu}
                        aria-label="Open menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        <span className="hamburger-icon" aria-hidden="true" style={{ transform: mobileMenuOpen ? 'rotate(45deg)' : 'none' }}></span>
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="mobile-nav-panel">
                        <button onClick={() => navigationHandler('/')} className={isActive('/') ? 'active' : ''}>Home</button>
                        <a href="/#chat" onClick={() => setMobileMenuOpen(false)}>Log Meal</a>
                        <a href="/#suggestions" onClick={() => setMobileMenuOpen(false)}>Suggestions</a>
                        <button onClick={() => navigationHandler('/voice-companion')} className={isActive('/voice-companion') ? 'active' : ''}>Health Companion</button>
                        <button onClick={() => navigationHandler('/profile')} className={isActive('/profile') ? 'active' : ''}>Profile</button>
                        
                        {loading ? (
                            <span className="mobile-loading-indicator">...</span>
                        ) : loggedIn ? (
                            <button onClick={handleLogout} className="nav-action-btn logout">Log Out</button>
                        ) : (
                            <button onClick={() => navigationHandler('/login')} className="nav-action-btn login">Sign In &rarr;</button>
                        )}
                    </div>
                )}
            </header>

            <Snackbar open={openalert} autoHideDuration={3000} onClose={handleClosealert} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleClosealert} severity="success" sx={{ width: '100%', bgcolor: '#10B981', color: '#090A0B', fontWeight: 700 }}>
                    Successfully logged out!
                </Alert>
            </Snackbar>
        </>
    );
};
