import { useState } from "react";
import { useAuth } from "../../Components/authContext";
import { useNavigate, Link } from "react-router-dom";
import API from "../../Components/api";
import { Snackbar, Alert } from "@mui/material";
import { ArrowRight, Mail, Lock, Activity } from "lucide-react";
import LoadingSpinner from "../../Components/ui/LoadingSpinner";
import "./login.css";

const BracketCorners = () => (
  <>
    <span className="auth-bracket-corner auth-bracket-tl" aria-hidden="true" />
    <span className="auth-bracket-corner auth-bracket-tr" aria-hidden="true" />
    <span className="auth-bracket-corner auth-bracket-bl" aria-hidden="true" />
    <span className="auth-bracket-corner auth-bracket-br" aria-hidden="true" />
  </>
);

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [openalert, setOpenalert] = useState(false);

  const handleClosealert = () => setOpenalert(false);
  const handleOpenalert = () => setOpenalert(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = { email, password };
    setLoading(true);
    console.log("[LOGIN SUBMIT] Attempting login with:", { email, passwordLength: password?.length });

    API.post("/login", user)
      .then((response) => {
        console.log("[LOGIN RESPONSE RECEIVED]:", response.data);
        if (response.data.msg === "Login Successfull") {
          setLoading(false);
          handleOpenalert();
          login(email);
          navigate("/");
        } else {
          setLoading(false);
          const errorMsg = response.data.msg || response.data.err || "Please check your credentials.";
          alert(`Login failed: ${errorMsg}`);
        }
      })
      .catch((error) => {
        setLoading(false);
        console.error("[LOGIN NETWORK/SERVER ERROR]:", error);
        const serverError = error.response?.data?.err || error.response?.data?.msg || error.message;
        alert(`Login failed! Server error: ${serverError}`);
      });
  };

  return (
    <div className="auth-telemetry-page">
      {/* Background Matrix Grid */}
      <div className="telemetry-grid-canvas" aria-hidden="true" />

      <div className="auth-telemetry-container">
        {/* Main Form Bracket Panel */}
        <div className="auth-bracket-panel">
          <BracketCorners />

          {/* Header Strip */}
          <div className="auth-panel-header">
            <span className="auth-eyebrow-code">
              <Activity size={12} className="cyan-icon" />
              Account Login
            </span>
          </div>

          <h1 className="auth-oswald-title">
            Welcome Back<span className="cyan-dot">!</span>
          </h1>

          <p className="auth-intro-copy">
            Sign in to continue tracking your meals and health journey.
          </p>

          <form onSubmit={handleSubmit} className="auth-telemetry-form">
            <div className="auth-field-group">
              <label htmlFor="email" className="auth-field-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-field-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-text-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="password" className="auth-field-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-field-icon" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-text-input"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-action-cta"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" color="#090A0B" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-panel-footer">
            <span className="auth-footer-prompt">Don't have an account?</span>
            <Link to="/signup" className="auth-switch-link">
              Create Account &rarr;
            </Link>
          </div>
        </div>
      </div>

      <Snackbar
        open={openalert}
        autoHideDuration={3000}
        onClose={handleClosealert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleClosealert}
          severity="success"
          sx={{ width: "100%", bgcolor: "#02D2E3", color: "#090A0B", fontWeight: 700 }}
        >
          Logged in successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Login;