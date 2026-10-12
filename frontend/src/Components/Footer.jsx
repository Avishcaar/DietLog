import './footer.css';

export const Footer = () => {
    return (
        <footer className="footer-telemetry">
            <div className="footer-telemetry-container">
                <div className="footer-telemetry-grid">
                    <div className="footer-telemetry-brand">
                        <div className="footer-brand-lockup">
                            <span className="footer-brand-mark">HB</span>
                            <span className="footer-brand-title">HEALTHBOT<span className="cyan-dot">.</span></span>
                        </div>
                        <p className="footer-brand-sub">
                            Track your nutrition effortlessly with AI-powered meal insights and voice companion.
                        </p>
                    </div>

                    <nav className="footer-telemetry-nav" aria-label="Footer navigation">
                        <a href="/">Home</a>
                        <a href="/#chat">Log Meal</a>
                        <a href="/#suggestions">Suggestions</a>
                        <a href="/voice-companion">Health Companion</a>
                        <a href="/profile">Profile</a>
                    </nav>

                    <div className="footer-telemetry-status">
                        <span className="footer-copy-text">
                            © {new Date().getFullYear()} HealthBot. Eat Healthy, Stay Fit.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
