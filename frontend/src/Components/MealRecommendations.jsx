import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Beef,
    Cookie,
    Droplet,
    RefreshCw,
    Eye,
    Scale,
    Clock,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { useAuth } from './authContext';
import API from './api';
import './meal-recommendations.css';

const PRESET_MEALS = [
    {
        name: "Grilled Salmon & Quinoa Medley",
        description: "Seared wild salmon, fluffy quinoa, steamed broccoli, and avocado slices for high protein and healthy fats.",
        calories: 640,
        proteins: 54,
        carbs: 48,
        fats: 18,
        prepTime: "20 min",
        totalWeight: "420g",
        tag: "High Protein"
    },
    {
        name: "Chicken Breast with Sweet Potato",
        description: "Herb-seasoned chicken breast with baked sweet potato mash and roasted asparagus for clean, sustained energy.",
        calories: 580,
        proteins: 48,
        carbs: 72,
        fats: 12,
        prepTime: "25 min",
        totalWeight: "460g",
        tag: "Balanced Energy"
    },
    {
        name: "Steak Strips with Sautéed Greens",
        description: "Tender steak strips with sautéed kale, wild mushrooms, and cauliflower puree for low carb and high satiety.",
        calories: 610,
        proteins: 50,
        carbs: 16,
        fats: 38,
        prepTime: "15 min",
        totalWeight: "380g",
        tag: "Low Carb"
    }
];

const BracketCorners = () => (
    <>
        <span className="rec-bracket-corner rec-bracket-tl" aria-hidden="true" />
        <span className="rec-bracket-corner rec-bracket-tr" aria-hidden="true" />
        <span className="rec-bracket-corner rec-bracket-bl" aria-hidden="true" />
        <span className="rec-bracket-corner rec-bracket-br" aria-hidden="true" />
    </>
);

export const MealRecommendations = () => {
    const { email } = useAuth();
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleViewDetails = (meal, index) => {
        navigate(`/meal/${index}`, { state: { meal } });
    };

    const fetchRecommendations = useCallback(async (count = 3, specificMealType = null) => {
        if (!email) return;

        setLoading(true);
        setError('');

        try {
            const response = await API.post('/meal-recommendations', {
                email: email,
                count,
                mealType: specificMealType
            });

            if (response.data && response.data.success) {
                setRecommendations(response.data.recommendations || []);
            } else {
                setError('Failed to fetch recommendations');
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError(err.response?.data?.message || 'Unable to load meal recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [email]);

    useEffect(() => {
        if (email) {
            fetchRecommendations();
        }
    }, [email, fetchRecommendations]);

    // Guest Mode: Display High-Quality Sample Meals
    if (!email) {
        return (
            <div className="telemetry-protocols-container">
                <div className="protocols-guest-banner">
                    <div className="guest-banner-info">
                        <Sparkles size={16} className="cyan-icon" />
                        <span>Sign in to unlock personalized meal recommendations based on your history</span>
                    </div>
                    <a href="/login" className="guest-unlock-btn">
                        <span>Sign In</span>
                        <ArrowRight size={14} />
                    </a>
                </div>

                <div className="telemetry-cards-grid">
                    {PRESET_MEALS.map((meal, index) => (
                        <div key={index} className="telemetry-meal-card">
                            <BracketCorners />
                            
                            <div className="meal-card-top-bar">
                                <span className="meal-protocol-tag">{meal.tag}</span>
                                <span className="meal-prep-meta">
                                    <Clock size={12} /> {meal.prepTime}
                                </span>
                            </div>

                            <h3 className="meal-card-title">{meal.name}</h3>
                            <p className="meal-card-desc">{meal.description}</p>

                            <div className="meal-macro-hud">
                                <div className="hud-macro-cell calories">
                                    <Flame size={14} className="hud-icon cal" />
                                    <span className="hud-val">{meal.calories}</span>
                                    <span className="hud-lbl">cal</span>
                                </div>
                                <div className="hud-macro-cell">
                                    <Beef size={14} className="hud-icon pro" />
                                    <span className="hud-val">{meal.proteins}g</span>
                                    <span className="hud-lbl">pro</span>
                                </div>
                                <div className="hud-macro-cell">
                                    <Cookie size={14} className="hud-icon cho" />
                                    <span className="hud-val">{meal.carbs}g</span>
                                    <span className="hud-lbl">carbs</span>
                                </div>
                                <div className="hud-macro-cell">
                                    <Droplet size={14} className="hud-icon fat" />
                                    <span className="hud-val">{meal.fats}g</span>
                                    <span className="hud-lbl">fat</span>
                                </div>
                            </div>

                            <div className="meal-card-footer">
                                <span className="meal-weight-tag">
                                    <Scale size={12} /> {meal.totalWeight}
                                </span>
                                <a href="/login" className="meal-action-trigger">
                                    <span>View Details</span>
                                    <ArrowRight size={13} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Logged-in Loading State
    if (loading && recommendations.length === 0) {
        return (
            <div className="protocols-loading-card">
                <BracketCorners />
                <div className="loading-spinner-block">
                    <RefreshCw size={28} className="spinning cyan-icon" />
                    <span className="loading-text">Cooking up personalized meal suggestions...</span>
                </div>
            </div>
        );
    }

    // Logged-in Error State
    if (error && recommendations.length === 0) {
        return (
            <div className="protocols-error-card">
                <BracketCorners />
                <p className="error-text-line">{error}</p>
                <button type="button" onClick={() => fetchRecommendations()} className="protocols-retry-btn">
                    <RefreshCw size={14} />
                    <span>Try Again</span>
                </button>
            </div>
        );
    }

    // Logged-in Populated State
    const displayList = recommendations.length > 0 ? recommendations : PRESET_MEALS;

    return (
        <div className="telemetry-protocols-container">
            <div className="protocols-toolbar-strip">
                <span className="protocols-live-tag">
                    <span className="live-pulse-dot" />
                    Personalized Meal Suggestions
                </span>
                <button
                    type="button"
                    onClick={() => fetchRecommendations()}
                    className="protocols-refresh-btn"
                    disabled={loading}
                    aria-label="Refresh meal suggestions"
                >
                    <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                    <span>Refresh Suggestions</span>
                </button>
            </div>

            <div className="telemetry-cards-grid">
                <AnimatePresence mode="popLayout">
                    {displayList.map((meal, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25, delay: index * 0.08 }}
                            className="telemetry-meal-card"
                        >
                            <BracketCorners />

                            <div className="meal-card-top-bar">
                                <span className="meal-protocol-tag">
                                    {meal.mealType ? meal.mealType : `Suggestion ${index + 1}`}
                                </span>
                                <span className="meal-prep-meta">
                                    <Clock size={12} /> {meal.prepTime || '20 min'}
                                </span>
                            </div>

                            <h3 className="meal-card-title">{meal.name}</h3>
                            <p className="meal-card-desc">{meal.description}</p>

                            <div className="meal-macro-hud">
                                <div className="hud-macro-cell calories">
                                    <Flame size={14} className="hud-icon cal" />
                                    <span className="hud-val">{meal.calories}</span>
                                    <span className="hud-lbl">cal</span>
                                </div>
                                <div className="hud-macro-cell">
                                    <Beef size={14} className="hud-icon pro" />
                                    <span className="hud-val">{meal.proteins}g</span>
                                    <span className="hud-lbl">pro</span>
                                </div>
                                <div className="hud-macro-cell">
                                    <Cookie size={14} className="hud-icon cho" />
                                    <span className="hud-val">{meal.carbs}g</span>
                                    <span className="hud-lbl">carbs</span>
                                </div>
                                <div className="hud-macro-cell">
                                    <Droplet size={14} className="hud-icon fat" />
                                    <span className="hud-val">{meal.fats}g</span>
                                    <span className="hud-lbl">fat</span>
                                </div>
                            </div>

                            <div className="meal-card-footer">
                                <span className="meal-weight-tag">
                                    <Scale size={12} /> {meal.totalWeight || '400g'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleViewDetails(meal, index)}
                                    className="meal-action-trigger"
                                >
                                    <Eye size={13} />
                                    <span>View Details</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MealRecommendations;
