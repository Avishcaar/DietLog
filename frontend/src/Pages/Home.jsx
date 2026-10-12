import { useState, useEffect } from 'react';
import { useAuth } from '../Components/authContext';
import {
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Activity,
  Bot,
  Camera,
  Keyboard,
  Mic2,
  ScanLine,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../Components/api';
import LoadingSpinner from '../Components/ui/LoadingSpinner';
import MealImageUpload from '../Components/MealImageUpload';
import AIAnalysisModal from '../Components/AIAnalysisModal';
import NutritionalBreakdownModal from '../Components/NutritionalBreakdownModal';
import VoiceInput from '../Components/VoiceInput';
import MealRecommendations from '../Components/MealRecommendations';
import Hero3DCanvas from '../Components/Hero3DCanvas';
import './home.css';

const LOG_MODES = [
  { id: 'bot', label: 'AI Chat', icon: Bot },
  { id: 'manual', label: 'Manual Entry', icon: Keyboard },
  { id: 'ai-scan', label: 'Meal Scanner', icon: Camera },
];

const PROMPT_SUGGESTIONS = [
  '200g Muesli, 1 Banana, 100g Chicken',
  '3 Scrambled Eggs with Avocado on Toast',
  'Grilled Salmon with Quinoa & Broccoli',
  'Greek Yogurt with Blueberries & Honey',
];

const BracketCorners = () => (
  <>
    <span className="bracket-corner bracket-tl" aria-hidden="true" />
    <span className="bracket-corner bracket-tr" aria-hidden="true" />
    <span className="bracket-corner bracket-bl" aria-hidden="true" />
    <span className="bracket-corner bracket-br" aria-hidden="true" />
  </>
);

export const Home = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [foodItem, setFoodItem] = useState('');
  const [foodAmount, setFoodAmount] = useState('');
  const [mode, setMode] = useState('bot');
  const [open, setOpen] = useState(false);
  const [openalert, setOpenalert] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [activeMacroTab, setActiveMacroTab] = useState('all');

  const macroStats = {
    all: { label: 'Daily Energy', value: '2,150', unit: 'kcal / target', note: 'Balanced whole-food daily nourishment' },
    protein: { label: 'Lean Protein', value: '140g', unit: '85% of daily goal', note: 'Salmon, Greek yogurt, eggs & plant proteins for recovery' },
    carbs: { label: 'Complex Carbs', value: '210g', unit: '70% of daily goal', note: 'Oats, quinoa, berries & honeycrisp apples for steady energy' },
    fats: { label: 'Healthy Fats', value: '62g', unit: '60% of daily goal', note: 'Fresh avocado, extra virgin olive oil, nuts & seeds' },
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleClosealert = () => setOpenalert(false);
  const handleOpenalert = () => setOpenalert(true);
  const { loggedIn, email } = useAuth();

  async function handleSubmit(e, voiceQuery = null) {
    if (e && e.preventDefault) e.preventDefault();
    const queryText = voiceQuery || input;
    if (!queryText.trim()) return;

    setLoading(true);
    try {
      const res = await API.post(
        '/query',
        { query: queryText },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setResponse(res.data.reply);
      setLoading(false);
      handleOpen();
    } catch (err) {
      setLoading(false);
      alert('Error fetching nutritional data. Please try again.');
    }
  }

  let isError = false;
  let resArray = [];
  if (response.startsWith('NO! dont')) {
    isError = true;
  } else {
    resArray = response.split(' ');
  }

  let breakdownData = null;
  if (response) {
    if (isError) {
      breakdownData = { error: response };
    } else if (resArray.length >= 7) {
      const cal = resArray[0];
      const pro = resArray[1];
      const carb = resArray[2];
      const fat = resArray[3];
      const fiber = resArray[4];
      const sugar = resArray[5];
      const amount = resArray[6];
      let item = '';
      for (let i = 7; i <= resArray.length - 1; i++) {
        item += resArray[i] + ' ';
      }
      breakdownData = {
        calories: cal,
        proteins: pro,
        carbs: carb,
        fats: fat,
        fiber: fiber,
        sugar: sugar,
        amount: amount,
        item: item.trim(),
      };
    }
  }

  const cal = breakdownData?.calories;
  const pro = breakdownData?.proteins;
  const carb = breakdownData?.carbs;
  const fat = breakdownData?.fats;
  const amount = breakdownData?.amount;
  const item = breakdownData?.item || '';

  async function addCalories(e) {
    e.preventDefault();
    if (!loggedIn || !email) {
      alert('Please Login to your account to add calories.');
      return;
    }
    try {
      await API.post(
        '/addcalories',
        {
          calories: mode === 'bot' ? cal : calories,
          proteins: mode === 'bot' ? pro : proteins,
          carbs: mode === 'bot' ? carb : carbs,
          fats: mode === 'bot' ? fat : fats,
          foodAmount: mode === 'manual' ? foodAmount : amount,
          foodItem: mode === 'bot' ? item : foodItem,
          email: email,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      ).then(() => {
        setInput('');
        setResponse('');
        setCalories('');
        setProteins('');
        setFats('');
        setCarbs('');
        setFoodAmount('');
        setFoodItem('');
        handleOpenalert();
        handleClose();
      });
    } catch (err) {
      if (err.response?.data?.msg === 'Not Logged in') {
        alert('Please Login to your account to add calories.');
      } else {
        alert('Error adding calories.');
      }
    }
  }

  const handleAIAnalysisComplete = (data) => {
    setAiAnalysisData(data);
    setAiModalOpen(true);
  };

  const handleQuickLog = async (data) => {
    if (!loggedIn || !email) {
      alert('Please Login to your account to add calories.');
      return;
    }
    try {
      await API.post(
        '/addcalories',
        {
          calories: data.totalNutrition.calories,
          proteins: data.totalNutrition.proteins,
          carbs: data.totalNutrition.carbs,
          fats: data.totalNutrition.fats,
          foodAmount: data.foodItems.map((food) => food.amount).join(', '),
          foodItem: data.foodItems.map((food) => food.name).join(', '),
          email: email,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      setAiModalOpen(false);
      setAiAnalysisData(null);
      handleOpenalert();
    } catch (err) {
      console.error('Error logging AI meal:', err);
      if (err.response?.data?.msg === 'Not Logged in') {
        alert('Please Login to your account to add calories.');
      } else {
        alert('Error adding calories.');
      }
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
    handleSubmit(null, transcript);
  };

  return (
    <div className="home-container">
      {/* Background Matrix Grid */}
      <div className="telemetry-grid-canvas" aria-hidden="true" />
      <div className="telemetry-ambient-radial" aria-hidden="true" />

      {/* ===================================================================
          HERO SECTION (OPTICAL 3D BOOLEAN 4 GLASS BACKDROP)
          =================================================================== */}
      <section className="telemetry-hero-wrapper">
        {/* Full-bleed 3D Glass Composition Backdrop */}
        <Hero3DCanvas />

        <div className="telemetry-hero-container">

          {/* Breadcrumb / Status Strip */}
          <div className="telemetry-status-strip">
            <div className="status-indicator-tag">
              <span className="telemetry-live-dot" />
              <span>Whole Food Nutrition</span>
            </div>
            <div className="telemetry-meta-tag">
              <Sparkles size={13} className="emerald-icon" />
              <span>Smart Meal Scanner • Real-time AI</span>
            </div>
            <div className="telemetry-user-state">
              {loggedIn ? (
                <span className="user-state-pill">{email ? email.split('@')[0] : 'User'}</span>
              ) : (
                <span className="user-state-pill guest">Free Forever</span>
              )}
            </div>
          </div>

          {/* Hero Main Grid */}
          <div className="telemetry-hero-grid">
            {/* Left Column: Health & Nutrition Focused Copy */}
            <div className="hero-identity-block">
              <div className="hero-badge-tag">
                <span>Healthy Eating Made Simple</span>
              </div>

              <h1 className="hero-oswald-title">
                Nourish Your Body.<br />
                <span className="emerald-text">Track Effortlessly.</span>
              </h1>

              <p className="hero-body-description">
                Get instant nutritional insights from real everyday food. Snap your meal, chat naturally with our AI nutritionist, or log your macros to feel energized and achieve your health goals.
              </p>

              {/* Action Buttons */}
              <div className="hero-button-cluster">
                <a href="#chat" className="tactical-cta-btn nutrition-cta">
                  <span>Log Today's Meal</span>
                  <ArrowRight size={16} className="btn-arrow" />
                </a>

                <a href="/voice-companion" className="tactical-secondary-btn">
                  <Mic2 size={16} className="emerald-icon" />
                  <span>Health Companion</span>
                </a>
              </div>

              {/* Hero Nutrition Highlights */}
              <div className="hero-spec-strip">
                <div className="spec-item">
                  <Sparkles size={14} className="emerald-icon" />
                  <span>Whole Food Analysis</span>
                </div>
                <div className="spec-item">
                  <Zap size={14} className="amber-icon" />
                  <span>Instant Calorie & Macro Breakdown</span>
                </div>
                <div className="spec-item">
                  <ShieldCheck size={14} className="emerald-icon" />
                  <span>100% Free Forever</span>
                </div>
              </div>
            </div>

            {/* Right Column: Spatial Glass Nutrition HUD Floating in 3D Space */}
            <div className="hero-spatial-hud-column">
              {/* Floating Spatial Micro-Pins */}
              <div className="spatial-pins-container">
                <button
                  type="button"
                  className={`spatial-macro-pin pin-protein ${activeMacroTab === 'protein' ? 'pin-active' : ''}`}
                  onClick={() => setActiveMacroTab(activeMacroTab === 'protein' ? 'all' : 'protein')}
                  title="Click to inspect Lean Protein"
                >
                  <span className="pin-dot" />
                  <span className="pin-title">Protein</span>
                  <span className="pin-val">140g</span>
                </button>

                <button
                  type="button"
                  className={`spatial-macro-pin pin-carbs ${activeMacroTab === 'carbs' ? 'pin-active' : ''}`}
                  onClick={() => setActiveMacroTab(activeMacroTab === 'carbs' ? 'all' : 'carbs')}
                  title="Click to inspect Complex Carbs"
                >
                  <span className="pin-dot" />
                  <span className="pin-title">Carbs</span>
                  <span className="pin-val">210g</span>
                </button>

                <button
                  type="button"
                  className={`spatial-macro-pin pin-fats ${activeMacroTab === 'fats' ? 'pin-active' : ''}`}
                  onClick={() => setActiveMacroTab(activeMacroTab === 'fats' ? 'all' : 'fats')}
                  title="Click to inspect Healthy Fats"
                >
                  <span className="pin-dot" />
                  <span className="pin-title">Avocado & Fats</span>
                  <span className="pin-val">62g</span>
                </button>
              </div>

              {/* Floating Frosted Glass HUD Panel */}
              <div className="hero-spatial-hud-card bracket-telemetry-panel">
                <BracketCorners />
                <div className="panel-header-line">
                  <div className="panel-header-left">
                    <span className="panel-title-label">Daily Nutrition Overview</span>
                    <span className="panel-subtitle-muted">Balanced Whole-Food Plate</span>
                  </div>
                  <span className="panel-badge-code">Interactive</span>
                </div>

                {/* Interactive Macro Filter Tabs */}
                <div className="spatial-macro-tabs">
                  {[
                    { id: 'all', label: 'All Fuel' },
                    { id: 'protein', label: 'Protein' },
                    { id: 'carbs', label: 'Carbs' },
                    { id: 'fats', label: 'Fats' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`spatial-tab-btn ${activeMacroTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveMacroTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="hero-floating-split-grid">
                  <div className="floating-stat-side">
                    <span className="stat-big-number">{macroStats[activeMacroTab].value}</span>
                    <span className="stat-unit-label">{macroStats[activeMacroTab].unit}</span>
                    <span className="stat-note-label">{macroStats[activeMacroTab].note}</span>
                  </div>

                  <div className="telemetry-macro-bars compact">
                    <div
                      className={`macro-bar-row ${activeMacroTab === 'protein' ? 'highlighted' : ''}`}
                      onClick={() => setActiveMacroTab('protein')}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="macro-tag">Proteins</span>
                      <div className="macro-track">
                        <div className="macro-fill pro" style={{ width: '85%' }} />
                      </div>
                      <span className="macro-val">140g</span>
                    </div>

                    <div
                      className={`macro-bar-row ${activeMacroTab === 'carbs' ? 'highlighted' : ''}`}
                      onClick={() => setActiveMacroTab('carbs')}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="macro-tag">Carbs</span>
                      <div className="macro-track">
                        <div className="macro-fill cho" style={{ width: '70%' }} />
                      </div>
                      <span className="macro-val">210g</span>
                    </div>

                    <div
                      className={`macro-bar-row ${activeMacroTab === 'fats' ? 'highlighted' : ''}`}
                      onClick={() => setActiveMacroTab('fats')}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="macro-tag">Fats</span>
                      <div className="macro-track">
                        <div className="macro-fill fat" style={{ width: '60%' }} />
                      </div>
                      <span className="macro-val">62g</span>
                    </div>
                  </div>
                </div>

                <div className="spatial-card-footer">
                  <span className="spatial-footer-hint">Click macros to inspect • Orbit 3D bowl behind</span>
                  <a href="#chat" className="spatial-quick-log-btn">Log Meal →</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================
          CHAT & LOGGING SECTION
          =================================================================== */}
      <section className="telemetry-console-wrapper" id="chat">
        <div className="telemetry-console-container">

          <div className="console-heading-row">
            <div className="console-title-group">
              <h2 className="console-oswald-head">
                Ask me about any food item!
              </h2>
              <div className="cyan-accent-line" />
              <p className="console-sub-copy">
                Get instant nutritional insights with our chatbot or log meals manually.
              </p>
            </div>

            {/* Quick Status Plate */}
            <div className="biometric-plate-card">
              <BracketCorners />
              <div className="plate-inner-grid">
                <div className="plate-badge-side">
                  <Target size={22} className="cyan-icon" />
                  <span className="plate-badge-year">Real-time</span>
                </div>
                <div className="plate-stats-side">
                  <div className="plate-stat-line">
                    <span className="plate-accent-text">AI</span>
                    <span className="plate-label-text">Powered Insights</span>
                  </div>
                  <div className="plate-stat-line">
                    <span className="plate-accent-text">Fast</span>
                    <span className="plate-label-text">Accurate Analysis</span>
                  </div>
                  <div className="plate-stat-line">
                    <span className="plate-accent-text">Free</span>
                    <span className="plate-label-text">Forever Tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Central Cockpit Grid */}
          <div className="cockpit-workspace-grid">
            {/* Main Interactive Logging Panel */}
            <div className="bracket-telemetry-panel cockpit-main-panel">
              <BracketCorners />

              {/* Mode Navigation Bar */}
              <div className="cockpit-toolbar">
                <div className="cockpit-module-tag">
                  <h3 className="toolbar-title">
                    {mode === 'bot' ? 'Ask me about any food item!' : mode === 'manual' ? 'Manual Entry' : 'Meal Scanner'}
                  </h3>
                </div>

                <div className="cockpit-tab-bar" role="tablist">
                  {LOG_MODES.map(({ id, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={id}
                      role="tab"
                      aria-selected={mode === id}
                      onClick={() => setMode(id)}
                      className={`cockpit-tab-btn ${mode === id ? 'is-active' : ''}`}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Mode Canvas */}
              <div className="cockpit-canvas">
                <AnimatePresence mode="wait">
                  {mode === 'bot' && (
                    <motion.div
                      key="bot-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="canvas-mode-block"
                    >
                      <div className="canvas-header-meta">
                        <p className="canvas-instruct-text">
                          Type any meal, snack, or ingredients to get instant calorie and macronutrient breakdown.
                        </p>
                      </div>

                      {/* Quick Prompt Suggestion Chips */}
                      <div className="prompt-chips-section">
                        <span className="chips-title-tag">Try asking for:</span>
                        <div className="chips-flex-row">
                          {PROMPT_SUGGESTIONS.map((item, idx) => (
                            <button
                              type="button"
                              key={idx}
                              className="telemetry-prompt-chip"
                              onClick={() => setInput(item)}
                            >
                              + {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Input Submission Form */}
                      <form onSubmit={handleSubmit} className="terminal-query-form">
                        <div className="terminal-input-row">
                          <span className="terminal-prompt-caret">&gt;</span>
                          <input
                            type="text"
                            value={input}
                            placeholder="e.g., 200g Muesli, 1 Banana, 100g Chicken..."
                            onChange={(e) => setInput(e.target.value)}
                            required
                            className="terminal-text-input"
                          />
                          <button
                            type="submit"
                            className="terminal-submit-btn"
                            disabled={loading}
                            aria-label="Send query"
                          >
                            {loading ? (
                              <LoadingSpinner size="small" color="#090A0B" />
                            ) : (
                              <>
                                <span>Send</span>
                                <SendIcon sx={{ fontSize: 15 }} />
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Voice Interface Integration */}
                      <div className="terminal-voice-tray">
                        <VoiceInput onTranscript={handleVoiceTranscript} disabled={loading} />
                      </div>
                    </motion.div>
                  )}

                  {mode === 'manual' && (
                    <motion.div
                      key="manual-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="canvas-mode-block"
                    >
                      <p className="canvas-instruct-text" style={{ marginBottom: '1.25rem' }}>
                        Enter nutritional information directly
                      </p>

                      <form onSubmit={addCalories} className="manual-telemetry-form">
                        <div className="manual-inputs-grid primary">
                          <div className="field-group">
                            <label className="field-label-tag">Food Item</label>
                            <input
                              type="text"
                              value={foodItem}
                              onChange={(e) => setFoodItem(e.target.value)}
                              required
                              className="terminal-text-input"
                              placeholder="e.g., Grilled Chicken"
                            />
                          </div>

                          <div className="field-group">
                            <label className="field-label-tag">Amount (g)</label>
                            <input
                              type="number"
                              value={foodAmount}
                              onChange={(e) => setFoodAmount(e.target.value)}
                              required
                              className="terminal-text-input"
                              placeholder="200"
                            />
                          </div>

                          <div className="field-group">
                            <label className="field-label-tag">Calories</label>
                            <input
                              type="number"
                              value={calories}
                              onChange={(e) => setCalories(e.target.value)}
                              required
                              className="terminal-text-input"
                              placeholder="330"
                            />
                          </div>
                        </div>

                        <div className="manual-inputs-grid macros">
                          <div className="field-group">
                            <label className="field-label-tag">Proteins (g)</label>
                            <input
                              type="number"
                              value={proteins}
                              onChange={(e) => setProteins(e.target.value)}
                              required
                              className="terminal-text-input"
                              placeholder="62"
                            />
                          </div>

                          <div className="field-group">
                            <label className="field-label-tag">Carbs (g)</label>
                            <input
                              type="number"
                              value={carbs}
                              onChange={(e) => setCarbs(e.target.value)}
                              required
                              className="terminal-text-input"
                              placeholder="0"
                            />
                          </div>

                          <div className="field-group">
                            <label className="field-label-tag">Fats (g)</label>
                            <input
                              type="number"
                              value={fats}
                              onChange={(e) => setFats(e.target.value)}
                              required
                              className="terminal-text-input"
                              placeholder="7"
                            />
                          </div>
                        </div>

                        <button type="submit" className="terminal-action-btn">
                          <span>Add</span>
                          <ArrowRight size={16} />
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {mode === 'ai-scan' && (
                    <motion.div
                      key="scan-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="canvas-mode-block"
                    >
                      <div className="scan-viewfinder-strip">
                        <ScanLine size={20} className="cyan-icon" />
                        <div>
                          <h4 className="scan-strip-title">Meal Scanner</h4>
                          <span className="field-label-tag" style={{ color: 'var(--raw-steel-400)', textTransform: 'none' }}>
                            Upload a photo and let us analyze the nutrition
                          </span>
                        </div>
                      </div>
                      <MealImageUpload onAnalysisComplete={handleAIAnalysisComplete} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Side: Health Companion Card */}
            <div className="bracket-telemetry-panel cockpit-side-panel">
              <BracketCorners />
              <p className="panel-title-label">Health Companion</p>

              <div className="side-terminal-content">
                <div className="voice-pulse-circle">
                  <Mic2 size={32} className="voice-center-icon" />
                  <span className="radar-wave wave-1" aria-hidden="true" />
                  <span className="radar-wave wave-2" aria-hidden="true" />
                </div>

                <div className="frequency-bars-cluster" aria-hidden="true">
                  <span className="freq-bar" />
                  <span className="freq-bar" />
                  <span className="freq-bar" />
                  <span className="freq-bar" />
                  <span className="freq-bar" />
                  <span className="freq-bar" />
                  <span className="freq-bar" />
                </div>

                <p className="side-terminal-desc">
                  Have natural voice conversations about your health and nutrition goals. Get personalized advice, meal planning, and support - all through voice.
                </p>

                <div className="hero-spec-strip" style={{ width: '100%', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <div className="spec-item">
                    <Sparkles size={14} className="cyan-icon" />
                    <span>Personalized Advice</span>
                  </div>
                  <div className="spec-item">
                    <Sparkles size={14} className="cyan-icon" />
                    <span>Remembers Context</span>
                  </div>
                  <div className="spec-item">
                    <Sparkles size={14} className="cyan-icon" />
                    <span>Natural Conversations</span>
                  </div>
                </div>

                <a href="/voice-companion" className="side-launch-btn">
                  <span>Start Conversation</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================
          MEAL RECOMMENDATIONS SECTION
          =================================================================== */}
      <section className="adaptive-matrix-wrapper" id="suggestions">
        <div className="adaptive-matrix-container">
          <div className="matrix-title-cluster">
            <h2 className="console-oswald-head">
              Personalized Meal Suggestions<span className="cyan-dot">.</span>
            </h2>
            <p className="matrix-subtext">
              Healthy meal recommendations based on your log history and nutrition goals.
            </p>
          </div>

          <div className="matrix-content-wrapper">
            <MealRecommendations />
          </div>
        </div>
      </section>

      {/* Modals & Feedback Notifications */}
      <NutritionalBreakdownModal
        open={open}
        onClose={handleClose}
        data={breakdownData}
        onAdd={addCalories}
      />

      <Snackbar
        open={openalert}
        autoHideDuration={3000}
        onClose={handleClosealert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClosealert}
          severity="success"
          sx={{
            width: '100%',
            bgcolor: '#02D2E3',
            color: '#090A0B',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          Meal logged successfully!
        </Alert>
      </Snackbar>

      <AIAnalysisModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        analysisData={aiAnalysisData}
        onQuickLog={handleQuickLog}
      />
    </div>
  );
};
