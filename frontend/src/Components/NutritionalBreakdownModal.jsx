import React from 'react';
import { Modal, Box } from '@mui/material';
import {
    Flame,
    Beef,
    Wheat,
    Droplet,
    CheckCircle,
    X,
    Activity,
    ArrowRight
} from 'lucide-react';
import './NutritionalBreakdownModal.css';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#0e0f14',
    border: '1px solid #1b1d24',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
    outline: 'none',
    width: '92%',
    maxWidth: '500px',
    overflow: 'hidden',
    padding: 0,
    boxSizing: 'border-box',
};

const BracketCorners = () => (
    <>
        <span className="modal-bracket-corner modal-bracket-tl" aria-hidden="true" />
        <span className="modal-bracket-corner modal-bracket-tr" aria-hidden="true" />
        <span className="modal-bracket-corner modal-bracket-bl" aria-hidden="true" />
        <span className="modal-bracket-corner modal-bracket-br" aria-hidden="true" />
    </>
);

const NutritionalBreakdownModal = ({ open, onClose, data, onAdd }) => {
    if (!data) return null;

    const { item, amount, calories, proteins, carbs, fats, fiber, sugar, error } = data;

    const totalMacros = (parseFloat(proteins) || 0) + (parseFloat(carbs) || 0) + (parseFloat(fats) || 0);
    const pPercent = totalMacros ? (parseFloat(proteins) / totalMacros) * 100 : 0;
    const cPercent = totalMacros ? (parseFloat(carbs) / totalMacros) * 100 : 0;
    const fPercent = totalMacros ? (parseFloat(fats) / totalMacros) * 100 : 0;

    return (
        <Modal open={open} onClose={onClose} aria-labelledby="nutrition-modal-title">
            <Box sx={modalStyle} className="telemetry-modal-container">
                <BracketCorners />

                {error ? (
                    <div className="telemetry-modal-error">
                        <div className="error-icon-wrapper">
                            <X size={28} />
                        </div>
                        <h3 className="error-oswald-title">Couldn't Analyze Meal</h3>
                        <p className="error-body-copy">{error}</p>
                        <button onClick={onClose} className="telemetry-modal-btn secondary">
                            <span>Try Again</span>
                        </button>
                    </div>
                ) : (
                    <div className="telemetry-modal-content">
                        {/* Header Line */}
                        <div className="telemetry-modal-header">
                            <div className="modal-header-tag">
                                <Activity size={13} className="cyan-icon" />
                                <span>Nutritional Breakdown</span>
                            </div>
                            <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="telemetry-modal-body">
                            <div className="modal-item-title-block">
                                <span className="modal-item-eyebrow">Food Item</span>
                                <h2 className="modal-item-name">{item}</h2>
                                <span className="modal-portion-badge">{amount}g serving</span>
                            </div>

                            {/* Calories Stat Card */}
                            <div className="modal-cal-card">
                                <Flame size={20} className="modal-flame-icon" />
                                <div className="modal-cal-text">
                                    <span className="modal-cal-value">{calories}</span>
                                    <span className="modal-cal-unit">kcal total</span>
                                </div>
                            </div>

                            {/* Macro Grid */}
                            <div className="modal-macros-grid">
                                <div className="modal-macro-cell pro">
                                    <div className="macro-cell-head">
                                        <Beef size={14} className="cyan-icon" />
                                        <span>Protein</span>
                                    </div>
                                    <div className="macro-cell-stat">
                                        <strong>{proteins}g</strong>
                                        <span>{Math.round(pPercent)}%</span>
                                    </div>
                                    <div className="modal-track">
                                        <div className="modal-fill pro" style={{ width: `${pPercent}%` }} />
                                    </div>
                                </div>

                                <div className="modal-macro-cell cho">
                                    <div className="macro-cell-head">
                                        <Wheat size={14} style={{ color: '#39ff14' }} />
                                        <span>Carbs</span>
                                    </div>
                                    <div className="macro-cell-stat">
                                        <strong>{carbs}g</strong>
                                        <span>{Math.round(cPercent)}%</span>
                                    </div>
                                    <div className="modal-track">
                                        <div className="modal-fill cho" style={{ width: `${cPercent}%` }} />
                                    </div>
                                </div>

                                <div className="modal-macro-cell fat">
                                    <div className="macro-cell-head">
                                        <Droplet size={14} style={{ color: '#ffd166' }} />
                                        <span>Fats</span>
                                    </div>
                                    <div className="macro-cell-stat">
                                        <strong>{fats}g</strong>
                                        <span>{Math.round(fPercent)}%</span>
                                    </div>
                                    <div className="modal-track">
                                        <div className="modal-fill fat" style={{ width: `${fPercent}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Micronutrients */}
                            <div className="modal-micros-row">
                                <div className="modal-micro-pill">
                                    <span className="micro-lbl">Fiber</span>
                                    <strong className="micro-val">{fiber || 0}g</strong>
                                </div>
                                <div className="modal-micro-pill">
                                    <span className="micro-lbl">Sugar</span>
                                    <strong className="micro-val">{sugar || 0}g</strong>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button onClick={onAdd} className="telemetry-modal-btn primary">
                                <CheckCircle size={16} />
                                <span>Add to Daily Log</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </Box>
        </Modal>
    );
};

export default NutritionalBreakdownModal;
