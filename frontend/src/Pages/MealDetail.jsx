import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    Flame,
    ChefHat,
    Plus,
    Check,
    RotateCcw,
    Scale
} from 'lucide-react';
import { Alert, Snackbar } from '@mui/material';
import { useAuth } from '../Components/authContext';
import API from '../Components/api';
import LoadingSpinner from '../Components/ui/LoadingSpinner';
import foodLoader from '../assets/illustrations/foodbyjag.gif';
import './MealDetail.css';
import './home.css';

const BracketCorners = () => (
    <>
        <span className="bracket-corner bracket-tl" aria-hidden="true" />
        <span className="bracket-corner bracket-tr" aria-hidden="true" />
        <span className="bracket-corner bracket-bl" aria-hidden="true" />
        <span className="bracket-corner bracket-br" aria-hidden="true" />
    </>
);

export const MealDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { email } = useAuth();
    const [meal, setMeal] = useState(null);
    const [detailedRecipe, setDetailedRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingToLog, setAddingToLog] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [checkedIngredients, setCheckedIngredients] = useState({});
    const [completedSteps, setCompletedSteps] = useState({});

    useEffect(() => {
        const fetchDetailedRecipe = async (mealData) => {
            setLoading(true);
            try {
                const response = await API.post('/meal-detail', {
                    email,
                    meal: mealData
                });
                if (response.data.success) {
                    setDetailedRecipe(response.data.details);
                }
            } catch (error) {
                setDetailedRecipe({
                    instructions: [
                        `First, let's gather everything: ${mealData.ingredients?.join(', ')}`,
                        'Give your veggies a good wash - nobody wants gritty greens!',
                        'Heat up your pan to medium. Patience here means better flavor.',
                        'Time for the main event - cook until it smells amazing.',
                        'Taste as you go. Trust your instincts!',
                        'Plate it up beautifully. We eat with our eyes first!'
                    ],
                    tips: [
                        'Mise en place is your best friend - prep everything before you start',
                        "If you're unsure, err on the side of undercooking. You can always cook more!"
                    ],
                    servings: 1,
                    difficulty: 'Medium',
                    chefNote: "Remember, cooking is about having fun. Don't stress about perfection!"
                });
            } finally {
                setLoading(false);
            }
        };

        if (location.state?.meal) {
            setMeal(location.state.meal);
            fetchDetailedRecipe(location.state.meal);
        } else {
            navigate('/');
        }
    }, [location.state, navigate, email]);

    const handleAddToLog = async () => {
        if (!meal) return;
        setAddingToLog(true);
        try {
            await API.post('/addcalories', {
                email,
                calories: meal.calories,
                proteins: meal.proteins,
                carbs: meal.carbs,
                fats: meal.fats,
                foodAmount: meal.servingSize,
                foodItem: meal.name
            });
            setAlertMessage(`🎉 Nice! ${meal.name} logged successfully!`);
            setShowAlert(true);
        } catch (error) {
            setAlertMessage('Oops! Something went wrong. Try again?');
            setShowAlert(true);
        } finally {
            setAddingToLog(false);
        }
    };

    const toggleIngredient = (idx) => {
        setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleStep = (idx) => {
        setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const allIngredientsChecked = meal?.ingredients?.every((_, idx) => checkedIngredients[idx]);
    const progress = meal?.ingredients ?
        (Object.values(checkedIngredients).filter(Boolean).length / meal.ingredients.length) * 100 : 0;

    const instructions = detailedRecipe?.instructions || [];

    if (!meal) {
        return (
            <div className="meal-page">
                <div className="page-loader"><LoadingSpinner size="large" /></div>
            </div>
        );
    }

    return (
        <div className="meal-page">
            <div className="telemetry-grid-canvas" aria-hidden="true" />
            <div className="telemetry-ambient-radial" aria-hidden="true" />

            <div className="page-scroll" style={{ position: 'relative', zIndex: 1 }}>
                <div className="meal-hero-section">
                    <div className="meal-hero-gradient"></div>

                    <nav className="meal-hero-nav">
                        <button className="btn-back" onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} />
                        </button>
                    </nav>

                    <div className="meal-hero-content">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <span className="meal-type-badge">{meal.tags?.[0] || 'NUTRITION TELEMETRY'}</span>
                            <h1 className="meal-hero-title-oswald">{meal.name}<span className="emerald-dot">.</span></h1>
                            <p className="meal-hero-subtitle">{meal.description}</p>

                            <div className="meal-hero-meta">
                                <span><Clock size={16} /> {meal.prepTime || '20 min'}</span>
                                <span>•</span>
                                <span><ChefHat size={16} /> {detailedRecipe?.difficulty || 'Medium'}</span>
                                <span>•</span>
                                <span><Flame size={16} /> {meal.calories} cal</span>
                                {meal.totalWeight && (
                                    <>
                                        <span>•</span>
                                        <span><Scale size={16} /> {meal.totalWeight}</span>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    className="stats-bar bracket-telemetry-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <BracketCorners />
                    <div className="stat-item">
                        <span className="stat-value">{meal.proteins}g</span>
                        <span className="stat-label">protein</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">{meal.carbs}g</span>
                        <span className="stat-label">carbs</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">{meal.fats}g</span>
                        <span className="stat-label">fats</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">{meal.calories}</span>
                        <span className="stat-label">kcal</span>
                    </div>
                </motion.div>

                <div className="content-wrapper">
                    <motion.section
                        className="ingredients-section bracket-telemetry-panel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <BracketCorners />
                        <div className="section-header">
                            <h2>What You'll Need</h2>
                            {progress > 0 && (
                                <div className="ingredient-progress">
                                    <div className="mini-progress">
                                        <div className="mini-progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                            )}
                        </div>

                        {allIngredientsChecked && (
                            <motion.div
                                className="all-ready-banner"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                ✓ All ingredients ready! Let's cook!
                            </motion.div>
                        )}

                        <ul className="ingredient-checklist">
                            {meal.ingredients?.map((ingredient, idx) => (
                                <motion.li
                                    key={idx}
                                    className={`ingredient-item ${checkedIngredients[idx] ? 'checked' : ''}`}
                                    onClick={() => toggleIngredient(idx)}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="checkbox">
                                        {checkedIngredients[idx] && <Check size={14} />}
                                    </div>
                                    <span>{ingredient}</span>
                                </motion.li>
                            ))}
                        </ul>

                        <button
                            className="btn-reset"
                            onClick={() => setCheckedIngredients({})}
                        >
                            <RotateCcw size={14} />
                            Reset checklist
                        </button>
                    </motion.section>

                    <motion.section
                        className="instructions-section bracket-telemetry-panel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <BracketCorners />
                        <div className="section-header">
                            <h2>Let's Make It</h2>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <img src={foodLoader} alt="Cooking..." className="recipe-loader-gif" />
                                <p>Getting your recipe ready...</p>
                            </div>
                        ) : (
                            <ol className="steps-list">
                                {instructions.map((step, idx) => (
                                    <motion.li
                                        key={idx}
                                        className={`step ${completedSteps[idx] ? 'done' : ''}`}
                                        onClick={() => toggleStep(idx)}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + idx * 0.1 }}
                                    >
                                        <div className="step-marker">
                                            {completedSteps[idx] ? <Check size={16} /> : idx + 1}
                                        </div>
                                        <div className="step-content">
                                            <p>{step}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ol>
                        )}

                        {detailedRecipe?.chefNote && (
                            <div className="chef-note">
                                <span className="chef-emoji">👨‍🍳</span>
                                <p><strong>Chef's Tip:</strong> {detailedRecipe.chefNote}</p>
                            </div>
                        )}
                    </motion.section>

                    {detailedRecipe?.tips?.length > 0 && (
                        <motion.section
                            className="tips-section bracket-telemetry-panel"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <BracketCorners />
                            <h2>Chef's Tips</h2>
                            <div className="tips-list">
                                {detailedRecipe.tips.slice(0, 2).map((tip, idx) => (
                                    <div key={idx} className="tip">
                                        <span>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </div>

                <div className="bottom-action">
                    <div className="action-content">
                        <div className="action-info">
                            <span className="action-cal">{meal.calories} cal</span>
                            <span className="action-serving">1 Serving</span>
                        </div>
                        <button
                            className="btn-log"
                            onClick={handleAddToLog}
                            disabled={addingToLog}
                        >
                            {addingToLog ? (
                                <LoadingSpinner size="small" color="white" />
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Log This Meal
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <Snackbar
                open={showAlert}
                autoHideDuration={3000}
                onClose={() => setShowAlert(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowAlert(false)}
                    severity="success"
                    sx={{
                        borderRadius: '12px',
                        fontWeight: 500
                    }}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default MealDetail;
