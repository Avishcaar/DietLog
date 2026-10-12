import { useEffect, useState } from "react";
import './profile.css';
import './home.css';
import CalCalendar from "../Components/CaloriesCalender/CalCalender";
import {
  MenuItem, Select, TablePagination
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import eating2Gif from '../assets/eating2.gif';
import excerciseGif from '../assets/excercise.gif';
import {
  Edit, TrendingUp, ChevronRight, Lock,
  CalendarDays, Sun, Moon, Coffee, Utensils,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import ChartSection from "../Components/ChartSection";
import API from "../Components/api";
import ProgressRing from "../Components/ui/ProgressRing";

const BracketCorners = () => (
  <>
    <span className="bracket-corner bracket-tl" aria-hidden="true" />
    <span className="bracket-corner bracket-tr" aria-hidden="true" />
    <span className="bracket-corner bracket-bl" aria-hidden="true" />
    <span className="bracket-corner bracket-br" aria-hidden="true" />
  </>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export const Profile = () => {
  const [calories, setCalories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [selectMode, setSelectMode] = useState(0);
  const [modeBasedEntries, setModeBasedEntries] = useState([]);
  const [userProfile, setUserProfile] = useState();
  const [userBmi, setUserBmi] = useState();
  const [email] = useState('');
  const [requiredCalories, setRequiredCalories] = useState('');
  const [requiredProteins, setRequiredProteins] = useState('');
  const [requiredCarbs, setRequiredCarbs] = useState('');
  const [requiredFats, setRequiredFats] = useState('');
  const [authorized, setauthorized] = useState(true);
  const [page, setPage] = useState(0);

  const navigate = useNavigate();
  const rowsPerPage = 5;

  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

  useEffect(() => {
    API.get('/verify')
      .then(res => {
        let email = res.data.user.email

        return API.get(`/getProfile`, {
          params: { email },
          headers: { 'Content-Type': 'application/json' }
        })
      })
      .then((response) => {
        const userCalories = response.data.user.calories;
        setUserProfile(response.data.user);
        setCalories(userCalories);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filtered = userCalories.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === today.getTime();
        });
        setModeBasedEntries(filtered);
        setLoading(false);
      })
      .catch((error) => {
        if (error) {
          setauthorized(false)
          setLoading(false);
        }
      });
  }, [email]);

  useEffect(() => {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectMode === 0) {
      setModeBasedEntries(calories.filter((entry) => {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      }));
    } else if (selectMode === 1) {
      setModeBasedEntries(calories.filter((entry) => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      }));
    } else if (selectMode === 2) {
      setModeBasedEntries(calories.filter((entry) => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
      }));
    } else if (selectMode === 3) {
      setModeBasedEntries(calories);
    }
  }, [selectMode, calories]);

  useEffect(() => {
    if (userProfile) {
      const heightInMeters = userProfile.height / 100;
      const bmi = userProfile.weight / (heightInMeters * heightInMeters);
      setUserBmi(bmi.toFixed(2));

      const bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + (userProfile.gender === "Male" ? 5 : -161);
      const tdee = bmr * userProfile.activitylevel;
      setRequiredCalories(tdee.toFixed(0));

      const proteinCalories = 0.2 * tdee;
      const fatCalories = 0.25 * tdee;
      const carbCalories = 0.55 * tdee;

      const proteinGrams = proteinCalories / 4;
      const fatGrams = fatCalories / 9;
      const carbGrams = carbCalories / 4;

      setRequiredProteins(proteinGrams.toFixed(0));
      setRequiredCarbs(carbGrams.toFixed(0));
      setRequiredFats(fatGrams.toFixed(0));
    }
  }, [userProfile]);


  const todaysEntries = calories.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  const todaysFixedTotals = todaysEntries.reduce((acc, entry) => ({
    calories: acc.calories + parseFloat(entry.calories || 0),
    proteins: acc.proteins + parseFloat(entry.proteins || 0),
    carbs: acc.carbs + parseFloat(entry.carbs || 0),
    fats: acc.fats + parseFloat(entry.fats || 0),
  }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });

  const selectedDayEntries = selectedDate
    ? calories.filter(entry =>
      new Date(entry.timestamp).toDateString() === new Date(selectedDate).toDateString()
    )
    : [];

  const optionsDate = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const idedRows = modeBasedEntries
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(row => ({
      ...row,
      id: row._id,
      timestamp: new Date(row.timestamp).toLocaleString('en-US', optionsDate)
    }));

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Underweight', color: '#f59e0b' };
    if (bmi < 25) return { text: 'Normal', color: '#10b981' };
    if (bmi < 30) return { text: 'Overweight', color: '#f59e0b' };
    return { text: 'Obese', color: '#ef4444' };
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getMealIcon = (dateString) => {
    const hour = new Date(dateString).getHours();
    if (hour >= 5 && hour < 11) return <Coffee size={16} />;
    if (hour >= 11 && hour < 16) return <Sun size={16} />;
    if (hour >= 16 && hour < 21) return <Utensils size={16} />;
    return <Moon size={16} />;
  };

  const getMealLabel = (dateString) => {
    const hour = new Date(dateString).getHours();
    if (hour >= 5 && hour < 11) return "Breakfast";
    if (hour >= 11 && hour < 16) return "Lunch";
    if (hour >= 16 && hour < 21) return "Dinner";
    return "Late Snack";
  };

  if (loading) return (
    <div className="profile-loading">
      <img src={excerciseGif} alt="Loading..." style={{ width: '120px', height: '120px', borderRadius: '20px', marginBottom: '1rem' }} />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        Getting your insights...
      </motion.p>
    </div>
  );

  return (
    <>
      {authorized ? (
        <motion.div
          className="profile-container"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ paddingTop: '100px', position: 'relative' }}
        >
          {/* Background Matrix Grid */}
          <div className="telemetry-grid-canvas" aria-hidden="true" />
          <div className="telemetry-ambient-radial" aria-hidden="true" />

          <motion.div className="intro-grid bracket-telemetry-panel" variants={itemVariants} style={{ paddingTop: '1.75rem', paddingBottom: '1.75rem', marginBottom: '2rem', position: 'relative' }}>
            <BracketCorners />
            <div>
              <div className="status-indicator-tag" style={{ marginBottom: '10px' }}>
                <span className="telemetry-live-dot" />
                <span>Nutrition Telemetry Profile</span>
              </div>
              <p className="section-kicker" style={{ marginBottom: '6px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>{getTimeGreeting()}</p>
              <h1 className="hero-oswald-title" style={{ fontSize: '2.5rem', margin: '0 0 1rem 0' }}>
                {userProfile.name}<span className="emerald-text">.</span>
              </h1>
              <button onClick={() => navigate('/editprofile')} className="btn-edit-minimal">
                <Edit size={15} />
                <span>Edit Profile</span>
              </button>
            </div>
          </motion.div>

          <div className="wellness-pillars">
            <motion.div variants={itemVariants}>
              <div className="stat-card bracket-telemetry-panel">
                <BracketCorners />
                <div className="pillar-icon-wrapper primary">
                  <TrendingUp size={20} />
                </div>
                <div className="pillar-content">
                  <span className="pillar-label">Body Harmony (BMI)</span>
                  <div className="pillar-value-group">
                    <span className="pillar-value">{userBmi}</span>
                    <span className="pillar-badge" style={{ backgroundColor: getBMICategory(parseFloat(userBmi)).color }}>
                      {getBMICategory(parseFloat(userBmi)).text}
                    </span>
                  </div>
                  <p className="pillar-insight">Based on your height & weight</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="stat-card bracket-telemetry-panel">
                <BracketCorners />
                <div className="pillar-icon-wrapper secondary">
                  <div className="gif-icon-container">
                    <img src={excerciseGif} alt="Exercise" className="pillar-gif-icon" />
                  </div>
                </div>
                <div className="pillar-content">
                  <span className="pillar-label">Daily Energy Target</span>
                  <div className="pillar-value-group">
                    <span className="pillar-value">{requiredCalories}</span>
                    <span className="pillar-unit">kcal</span>
                  </div>
                  <p className="pillar-insight">Recommended for your goal</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="stat-card bracket-telemetry-panel">
                <BracketCorners />
                <div className="pillar-icon-wrapper accent">
                  <CalendarDays size={20} />
                </div>
                <div className="pillar-content">
                  <span className="pillar-label">Consistency</span>
                  <div className="pillar-value-group">
                    <span className="pillar-value">{modeBasedEntries.length}</span>
                    <span className="pillar-unit">logs</span>
                  </div>
                  <p className="pillar-insight">Entries this period</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="dashboard-grid">
            <motion.div variants={itemVariants}>
              <div className="project-card nutrition-insight-card bracket-telemetry-panel">
                <BracketCorners />
                <div className="card-header-human">
                  <h3>Today's Micros Intake</h3>
                </div>

                {todaysEntries.length === 0 ? (
                  <div className="journal-empty" style={{ padding: '2rem' }}>
                    <motion.div
                      className="empty-gif-wrapper"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <img src={eating2Gif} alt="Waiting for meal" className="empty-gif" />
                    </motion.div>
                    <p>No meals logged today.</p>
                    <span className="empty-hint">Eat to fill your rings!</span>
                  </div>
                ) : (
                  <div className="progress-showcase">
                    <div className="ring-group">
                      <ProgressRing
                        progress={Math.min(((todaysFixedTotals.calories / (parseFloat(requiredCalories) || 1)) * 100) || 0, 100)}
                        size={120}
                        strokeWidth={8}
                        label="Energy"
                        color="#10b981"
                        animated
                      />
                    </div>
                    <div className="macro-bars">
                      <div className="macro-bar-item">
                        <div className="macro-info">
                          <span className="macro-name">Protein</span>
                          <span className="macro-stat">{todaysFixedTotals.proteins.toFixed(1)} / {requiredProteins}g</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill protein" style={{ width: `${Math.min(((todaysFixedTotals.proteins / parseFloat(requiredProteins)) * 100) || 0, 100)}%` }}></div>
                        </div>
                      </div>
                      <div className="macro-bar-item">
                        <div className="macro-info">
                          <span className="macro-name">Carbs</span>
                          <span className="macro-stat">{todaysFixedTotals.carbs.toFixed(1)} / {requiredCarbs}g</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill carbs" style={{ width: `${Math.min(((todaysFixedTotals.carbs / parseFloat(requiredCarbs)) * 100) || 0, 100)}%` }}></div>
                        </div>
                      </div>
                      <div className="macro-bar-item">
                        <div className="macro-info">
                          <span className="macro-name">Fats</span>
                          <span className="macro-stat">{todaysFixedTotals.fats.toFixed(1)} / {requiredFats}g</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill fats" style={{ width: `${Math.min(((todaysFixedTotals.fats / parseFloat(requiredFats)) * 100) || 0, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="project-card journal-card bracket-telemetry-panel">
                <BracketCorners />
                <div className="journal-header">
                  <div>
                    <h3 className="section-title-human">Your Log</h3>
                  </div>
                  <Select
                    value={selectMode}
                    onChange={(e) => setSelectMode(e.target.value)}
                    size="small"
                    variant="standard"
                    disableUnderline
                    className="human-select"
                  >
                    <MenuItem value={0}>Today</MenuItem>
                    <MenuItem value={1}>This Week</MenuItem>
                    <MenuItem value={2}>This Month</MenuItem>
                    <MenuItem value={3}>All Time</MenuItem>
                  </Select>
                </div>

                <div className="journal-list">
                  {modeBasedEntries.length === 0 ? (
                    <div className="journal-empty">
                      <motion.div
                        className="empty-gif-wrapper"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <img src={eating2Gif} alt="Waiting for meal" className="empty-gif" />
                      </motion.div>
                      <p>No meals logged yet.</p>
                      <span className="empty-hint">Time to eat something nutritious?</span>
                      <button
                        onClick={() => navigate('/')}
                        className="btn-log-meal"
                      >
                        <Utensils size={14} />
                        Log a Meal
                      </button>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {idedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
                        <motion.div
                          key={item.id}
                          className="journal-entry"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="entry-time-line">
                            <div className="time-icon-container">
                              {getMealIcon(item.timestamp)}
                            </div>
                            <div className="time-line"></div>
                          </div>
                          <div className="entry-card">
                            <div className="entry-main">
                              <div className="entry-header-row">
                                <span className="entry-label">
                                  {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {getMealLabel(item.timestamp)}
                                </span>
                                <span className="entry-time">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <h4 className="entry-food">{item.foodItem}</h4>
                              <div className="entry-infos">
                                <div className="entry-macros">
                                  <span className="macro-tag cal">{item.calories} kcal</span>
                                  <span className="macro-divider">|</span>
                                  <span className="macro-tag pro">{item.proteins}g Protein</span>
                                  <span className="macro-tag carbs">{item.carbs}g Carbs</span>
                                  <span className="macro-tag fats">{item.fats}g Fats</span>
                                </div>
                              </div>
                            </div>
                            <div className="entry-amount">
                              {item.foodAmount}g
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {modeBasedEntries.length > 0 && (
                  <TablePagination
                    component="div"
                    count={idedRows.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[]}
                    className="human-pagination"
                  />
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="project-card calendar-card-human bracket-telemetry-panel">
                <BracketCorners />
                <h3 className="section-title-human">Consistency Tracker</h3>
                <CalCalendar
                  selectedDayEntries={selectedDayEntries}
                  calories={calories}
                  requiredcalories={requiredCalories}
                  requiredProteins={requiredProteins}
                  requiredCarbs={requiredCarbs}
                  requiredFats={requiredFats}
                  onDateClick={(date) => setSelectedDate(date)}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="chart-section-human bracket-telemetry-panel" style={{ position: 'relative' }}>
              <BracketCorners />
              <ChartSection calories={calories} />
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <div className="profile-container not-authorized-container">
          <div className="project-card not-auth-card minimal" style={{ padding: '40px', minHeight: 'auto', margin: 'auto' }}>
            <div className="not-auth-content minimal">
              <div className="lock-icon-minimal">
                <Lock size={32} />
              </div>

              <div className="not-auth-header">
                <h1 className="not-auth-title" style={{ color: 'var(--home-text)', fontWeight: 800 }}>Sign In Required</h1>
                <p className="not-auth-subtitle" style={{ color: 'var(--home-muted)' }}>
                  Please log in to view specific details about your profile and stats.
                </p>
              </div>

              <div className="auth-actions-row" style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-send-premium" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800 }}>Sign In</span>
                  <ChevronRight size={20} />
                </button>

                <button
                  onClick={() => navigate('/signup')}
                  className="btn-edit-minimal" style={{ border: 'none', background: 'transparent' }}
                >
                  Create Account
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
