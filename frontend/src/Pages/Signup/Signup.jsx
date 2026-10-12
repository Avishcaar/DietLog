import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaBirthdayCake,
  FaRulerVertical,
  FaWeightHanging,
  FaVenusMars,
  FaEnvelope,
  FaLock,
  FaDumbbell,
} from "react-icons/fa";
import { ArrowRight, Activity } from "lucide-react";
import API from "../../Components/api";
import LoadingSpinner from "../../Components/ui/LoadingSpinner";
import "../Login/login.css";

const BracketCorners = () => (
  <>
    <span className="auth-bracket-corner auth-bracket-tl" aria-hidden="true" />
    <span className="auth-bracket-corner auth-bracket-tr" aria-hidden="true" />
    <span className="auth-bracket-corner auth-bracket-bl" aria-hidden="true" />
    <span className="auth-bracket-corner auth-bracket-br" aria-hidden="true" />
  </>
);

export const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    height: "",
    weight: "",
    gender: "Male",
    activity: "1.2",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    API.post("/signup", form)
      .then((res) => {
        setLoading(false);
        if (res.data.msg === "User already registered") {
          alert("Email already registered. Please try again using a different email.");
        } else {
          alert("Signup successful! Please login to continue.");
          navigate("/login");
        }
      })
      .catch(() => {
        setLoading(false);
        alert("Signup failed! Please try again.");
      });
  };

  const fields = [
    { name: "name", label: "Full Name", icon: <FaUser />, placeholder: "e.g. Alex Mercer", type: "text" },
    { name: "email", label: "Email Address", icon: <FaEnvelope />, placeholder: "your@email.com", type: "email" },
    { name: "password", label: "Password", icon: <FaLock />, placeholder: "Create strong password", type: "password" },
    { name: "age", label: "Age", icon: <FaBirthdayCake />, placeholder: "28", type: "number" },
    { name: "height", label: "Height (cm)", icon: <FaRulerVertical />, placeholder: "180", type: "number" },
    { name: "weight", label: "Weight (kg)", icon: <FaWeightHanging />, placeholder: "75", type: "number" },
    {
      name: "gender",
      label: "Gender",
      icon: <FaVenusMars />,
      type: "select",
      options: ["Male", "Female"],
      placeholder: "Gender",
    },
    {
      name: "activity",
      label: "Activity Level",
      icon: <FaDumbbell />,
      type: "select",
      options: ["1.2", "1.375", "1.55", "1.725", "1.9"],
      optionLabels: [
        "Sedentary (Little or no exercise)",
        "Lightly active (1-3 days/week)",
        "Moderately active (3-5 days/week)",
        "Very active (6-7 days/week)",
        "Super active (Athlete level)",
      ],
      placeholder: "Activity Level",
    },
  ];

  return (
    <div className="auth-telemetry-page">
      {/* Background Matrix Grid */}
      <div className="telemetry-grid-canvas" aria-hidden="true" />

      <div className="auth-telemetry-container wide">
        <div className="auth-bracket-panel">
          <BracketCorners />

          {/* Header Strip */}
          <div className="auth-panel-header">
            <span className="auth-eyebrow-code">
              <Activity size={12} className="cyan-icon" />
              Registration
            </span>
          </div>

          <h1 className="auth-oswald-title">
            Create Account<span className="cyan-dot">.</span>
          </h1>

          <p className="auth-intro-copy">
            Start tracking your daily meals, macros, and personal health goals.
          </p>

          <form onSubmit={handleSubmit} className="auth-telemetry-form">
            <div className="signup-fields-grid">
              {fields.map((field) => (
                <div key={field.name} className={`auth-field-group ${field.name === 'activity' ? 'full-span' : ''}`}>
                  <label htmlFor={field.name} className="auth-field-label">
                    {field.label}
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-field-icon">{field.icon}</span>

                    {field.type === "select" ? (
                      <select
                        id={field.name}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        className="auth-select-input"
                      >
                        {field.options.map((opt, idx) => (
                          <option key={opt} value={opt}>
                            {field.optionLabels ? field.optionLabels[idx] : opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        required
                        placeholder={field.placeholder}
                        value={form[field.name]}
                        onChange={handleChange}
                        className="auth-text-input"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="auth-action-cta"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" color="#090A0B" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-panel-footer">
            <span className="auth-footer-prompt">Already have an account?</span>
            <Link to="/login" className="auth-switch-link">
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;