import {
    Modal,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    LinearProgress,
    IconButton,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Circle } from 'lucide-react';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'var(--color-surface)',
    boxShadow: 'var(--shadow-2xl)',
    p: 4,
    borderRadius: 'var(--radius-xl)',
    maxWidth: 600,
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid var(--color-border)',
};

export const AIAnalysisModal = ({ open, onClose, analysisData, onQuickLog }) => {
    if (!analysisData) return null;

    const { foodItems, totalNutrition } = analysisData;

    const totalMacros =
        (totalNutrition?.proteins || 0) +
        (totalNutrition?.carbs || 0) +
        (totalNutrition?.fats || 0);

    const proteinPercent = totalMacros > 0
        ? ((totalNutrition?.proteins || 0) / totalMacros * 100).toFixed(1)
        : 0;
    const carbPercent = totalMacros > 0
        ? ((totalNutrition?.carbs || 0) / totalMacros * 100).toFixed(1)
        : 0;
    const fatPercent = totalMacros > 0
        ? ((totalNutrition?.fats || 0) / totalMacros * 100).toFixed(1)
        : 0;

    const handleQuickLog = () => {
        if (onQuickLog) {
            onQuickLog(analysisData);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Typography variant="h5" fontWeight="bold" className="gradient-text">
                                AI Agent Analysis Results
                            </Typography>
                        </div>
                        <Typography variant="body1">
                            {foodItems?.length || 0} food item{foodItems?.length !== 1 ? 's' : ''} detected
                        </Typography>
                    </div>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </div>

                {foodItems && foodItems.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <Typography variant="h6" fontWeight="600" style={{ marginBottom: '16px', color: 'var(--color-text-primary)' }}>
                            Detected Items
                        </Typography>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            padding: '16px',
                            background: 'var(--color-surface-hover)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                        }}>
                            {foodItems.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        background: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-full)',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    <Circle size={6} fill="var(--color-primary)" color="var(--color-primary)" />
                                    <Typography variant="body2" fontWeight="500" style={{ color: 'var(--color-text-primary)' }}>
                                        {item.name}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {totalNutrition && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <TrendingUpIcon style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
                            <Typography variant="h6" fontWeight="600" style={{ color: 'var(--color-text-primary)' }}>
                                Total Nutrition
                            </Typography>
                        </div>
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: 'var(--gradient-primary)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: '16px',
                            }}
                        >
                            <Typography variant="h3" style={{ color: 'white', fontWeight: '700' }}>
                                {totalNutrition.calories}
                            </Typography>
                            <Typography variant="body1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                                Total Calories (kcal)
                            </Typography>
                        </div>

                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                                            <strong>Proteins</strong>
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <span>{totalNutrition.proteins}g</span>
                                                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85em' }}>
                                                    ({proteinPercent}%)
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ paddingTop: 0, paddingBottom: 1, borderColor: 'var(--color-border)' }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={parseFloat(proteinPercent)}
                                                style={{ height: '8px', borderRadius: '4px' }}
                                                sx={{
                                                    backgroundColor: 'var(--color-surface-hover)',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: '#ef4444',
                                                        borderRadius: '4px',
                                                    },
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell sx={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                                            <strong>Carbs</strong>
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <span>{totalNutrition.carbs}g</span>
                                                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85em' }}>
                                                    ({carbPercent}%)
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ paddingTop: 0, paddingBottom: 1, borderColor: 'var(--color-border)' }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={parseFloat(carbPercent)}
                                                style={{ height: '8px', borderRadius: '4px' }}
                                                sx={{
                                                    backgroundColor: 'var(--color-surface-hover)',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: '#3b82f6',
                                                        borderRadius: '4px',
                                                    },
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell sx={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                                            <strong>Fats</strong>
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <span>{totalNutrition.fats}g</span>
                                                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85em' }}>
                                                    ({fatPercent}%)
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ paddingTop: 0, borderColor: 'var(--color-border)' }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={parseFloat(fatPercent)}
                                                style={{ height: '8px', borderRadius: '4px' }}
                                                sx={{
                                                    backgroundColor: 'var(--color-surface-hover)',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: '#eab308',
                                                        borderRadius: '4px',
                                                    },
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleQuickLog}
                        className="btn-modal gradient-primary"
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                        }}
                    >
                        <CheckCircleIcon />
                        <span>Add to Log</span>
                    </button>
                </div>
            </Box>
        </Modal>
    );
};

export default AIAnalysisModal;
