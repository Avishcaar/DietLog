import { useEffect, useState } from "react";
import { FaUser, FaBirthdayCake, FaRulerVertical, FaWeightHanging, FaVenusMars, FaEnvelope, FaDumbbell, FaLeaf, FaCheck } from "react-icons/fa";
import { ArrowRight, MapPin } from "lucide-react";
import API from "../../Components/api";
import { Snackbar, Alert } from "@mui/material";
import LoadingSpinner from "../../Components/ui/LoadingSpinner";
import "./editprofile.css";
import "../home.css";

const BracketCorners = () => (
  <>
    <span className="bracket-corner bracket-tl" aria-hidden="true" />
    <span className="bracket-corner bracket-tr" aria-hidden="true" />
    <span className="bracket-corner bracket-bl" aria-hidden="true" />
    <span className="bracket-corner bracket-br" aria-hidden="true" />
  </>
);

const COUNTRIES = [
  { value: '', label: 'Select Country' },
  { value: 'India', label: '🇮🇳 India' },
  { value: 'USA', label: '🇺🇸 United States' },
  { value: 'UK', label: '🇬🇧 United Kingdom' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'UAE', label: '🇦🇪 UAE' },
  { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
  { value: 'Pakistan', label: '🇵🇰 Pakistan' },
  { value: 'Bangladesh', label: '🇧🇩 Bangladesh' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'Malaysia', label: '🇲🇾 Malaysia' },
  { value: 'Middle East', label: '🌍 Middle East (Other)' },
  { value: 'Other', label: '🌐 Other' }
];

const REGIONS = {
  'India': [
    { value: '', label: 'Select Region (Optional)' },
    { value: 'North', label: 'North India' },
    { value: 'South', label: 'South India' },
    { value: 'East', label: 'East India' },
    { value: 'West', label: 'West India' }
  ],
  'USA': [
    { value: '', label: 'Select Region (Optional)' },
    { value: 'West Coast', label: 'West Coast' },
    { value: 'East Coast', label: 'East Coast' },
    { value: 'South', label: 'South' },
    { value: 'Midwest', label: 'Midwest' },
    { value: 'Northeast', label: 'Northeast' }
  ]
};

export const EditProfile = () => {
  const [userProfile, setUserProfile] = useState({});
  const [form, setForm] = useState({
    name: "", age: "", height: "", weight: "", gender: "", email: "", activity: "",
    country: "", city: "", region: ""
  });
  const [dietaryRestrictions, setDietaryRestrictions] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    halal: false,
    kosher: false,
    noBeef: false,
    noPork: false
  });
  const [openalert, setOpenalert] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClosealert = () => setOpenalert(false);
  const handleOpenalert = () => setOpenalert(true);

  useEffect(() => {
    API.get('/verify')
      .then(res => {
        const userEmail = res.data.user.email;
        setForm(prev => ({
          ...prev,
          email: userEmail
        }))
        return API.get("/getProfile", { params: { email: userEmail } })

      }).then(res => {
        const user = res.data.user;
        setUserProfile(user);
        setForm({
          name: user.name || "",
          age: user.age || "",
          height: user.height || "",
          weight: user.weight || "",
          gender: user.gender || "",
          email: user.email || "",
          activity: user.activitylevel || "",
          country: user.location?.country || "",
          city: user.location?.city || "",
          region: user.location?.region || ""
        });
        if (user.dietaryRestrictions) {
          setDietaryRestrictions({
            vegetarian: user.dietaryRestrictions.vegetarian || false,
            vegan: user.dietaryRestrictions.vegan || false,
            glutenFree: user.dietaryRestrictions.glutenFree || false,
            dairyFree: user.dietaryRestrictions.dairyFree || false,
            halal: user.dietaryRestrictions.halal || false,
            kosher: user.dietaryRestrictions.kosher || false,
            noBeef: user.dietaryRestrictions.noBeef || false,
            noPork: user.dietaryRestrictions.noPork || false
          });
        }
      });
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDietaryChange = (restriction) => {
    setDietaryRestrictions(prev => ({
      ...prev,
      [restriction]: !prev[restriction]
    }));
  };

  const handleUpdate = e => {
    e.preventDefault();
    setLoading(true);

    const updateData = {
      ...userProfile,
      name: form.name,
      age: form.age,
      height: form.height,
      weight: form.weight,
      gender: form.gender,
      activitylevel: form.activity,
      location: {
        country: form.country,
        city: form.city,
        region: form.region
      },
      dietaryRestrictions: dietaryRestrictions
    };

    API.patch(`/updateProfile/${userProfile._id}`, updateData)
      .then(() => {
        setLoading(false);
        handleOpenalert();
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const basicFields = [
    { name: "name", label: "Name", icon: <FaUser />, type: "text" },
    { name: "age", label: "Age", icon: <FaBirthdayCake />, type: "number" },
    { name: "height", label: "Height (cm)", icon: <FaRulerVertical />, type: "number" },
    { name: "weight", label: "Weight (kg)", icon: <FaWeightHanging />, type: "number" },
    { name: "gender", label: "Gender", icon: <FaVenusMars />, type: "select", options: ["Male", "Female"] },
    { name: "email", label: "Email", icon: <FaEnvelope />, type: "email" },
    {
      name: "activity", label: "Activity Level", icon: <FaDumbbell />, type: "select",
      options: ["1.2", "1.375", "1.55", "1.725", "1.9"],
      optionLabels: ["Sedentary (Little or no exercise)", "Lightly active (1-3 days/week)", "Moderately active (3-5 days/week)", "Very active (6-7 days/week)", "Super active (Athlete level)"]
    }
  ];

  const dietaryOptions = [
    { key: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
    { key: 'vegan', label: 'Vegan', emoji: '🌱' },
    { key: 'halal', label: 'Halal', emoji: '☪️' },
    { key: 'kosher', label: 'Kosher', emoji: '✡️' },
    { key: 'noBeef', label: 'No Beef', emoji: '🐄' },
    { key: 'noPork', label: 'No Pork', emoji: '🐷' },
    { key: 'glutenFree', label: 'Gluten-Free', emoji: '🌾' },
    { key: 'dairyFree', label: 'Dairy-Free', emoji: '🥛' }
  ];

  return (
    <div className="editprofile-container">
      <div className="telemetry-grid-canvas" aria-hidden="true" />
      <div className="telemetry-ambient-radial" aria-hidden="true" />

      <div className="editprofile-card bracket-telemetry-panel" style={{ position: 'relative', zIndex: 1 }}>
        <BracketCorners />
        <div className="editprofile-header">
          <div className="telemetry-pill-mono" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
            <span className="telemetry-dot-pulse" />
            <span>PROFILE TELEMETRY • USER CONFIG</span>
          </div>
          <h1 className="editprofile-title-oswald">EDIT PROFILE<span className="emerald-dot">.</span></h1>
          <p className="editprofile-subtitle">Personalize your metabolic parameters, location, and dietary restrictions.</p>
        </div>

        <form onSubmit={handleUpdate} className="editprofile-form">
          <div className="editprofile-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="editprofile-grid">
              {basicFields.map(f => (
                <div key={f.name} className={`form-group ${f.name === 'email' || f.name === 'activity' ? 'editprofile-grid-full' : ''}`}>
                  <label htmlFor={f.name} className="form-label">{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      id={f.name}
                      name={f.name}
                      value={form[f.name]}
                      required
                      onChange={handleChange}
                      className="form-select"
                    >
                      {f.options.map((opt, i) => (
                        <option key={opt} value={opt}>{f.optionLabels ? f.optionLabels[i] : opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="input-with-icon">
                      <input
                        id={f.name}
                        name={f.name}
                        type={f.type}
                        value={form[f.name]}
                        required
                        onChange={handleChange}
                        className="form-input"
                        disabled={f.name === 'email'}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="editprofile-section location-section">
            <h3 className="section-title">
              <MapPin size={20} />
              <span>Your Location</span>
            </h3>
            <p className="section-desc">Helps us suggest locally available and culturally appropriate meals</p>

            <div className="editprofile-grid">
              <div className="form-group">
                <label htmlFor="country" className="form-label">Country</label>
                <div className="input-with-icon">
                  <select
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="city" className="form-label">City</label>
                <div className="input-with-icon">
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Mumbai, New York"
                  />
                </div>
              </div>

              {REGIONS[form.country] && (
                <div className="form-group editprofile-grid-full">
                  <label htmlFor="region" className="form-label">Region (for more specific recommendations)</label>
                  <select
                    id="region"
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {REGIONS[form.country].map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="editprofile-section dietary-section">
            <h3 className="section-title">
              <FaLeaf />
              <span>Dietary Preferences</span>
            </h3>
            <p className="section-desc">Select any dietary restrictions or preferences</p>

            <div className="dietary-grid">
              {dietaryOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  className={`dietary-chip ${dietaryRestrictions[opt.key] ? 'active' : ''}`}
                  onClick={() => handleDietaryChange(opt.key)}
                >
                  <span className="dietary-label">{opt.label}</span>
                  {dietaryRestrictions[opt.key] && <FaCheck className="dietary-check" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit gradient-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" color="white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save Changes</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>

      <Snackbar
        open={openalert}
        autoHideDuration={3000}
        onClose={handleClosealert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClosealert} severity="success" sx={{ width: '100%' }}>
          Profile Updated! Meal recommendations will now be personalized for your location.
        </Alert>
      </Snackbar>
    </div>
  );
};