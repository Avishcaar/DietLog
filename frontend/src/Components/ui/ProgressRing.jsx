import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const ProgressRing = ({
    progress = 0,
    size = 120,
    strokeWidth = 8,
    label = '',
    color = 'var(--color-primary)',
    bgColor = 'var(--color-border)',
    showPercentage = true,
    animated = true,
}) => {
    const [displayProgress, setDisplayProgress] = useState(0);

    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => {
                setDisplayProgress(progress);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setDisplayProgress(progress);
        }
    }, [progress, animated]);

    const radius = size / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    const angle = (displayProgress / 100) * 360;
    const radians = ((angle - 90) * Math.PI) / 180;
    const endX = centerX + radius * Math.cos(radians);
    const endY = centerY + radius * Math.sin(radians);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const createPiePath = () => {
        if (displayProgress === 0) return '';
        if (displayProgress >= 100) {
            return `M ${centerX},${centerY} m 0,-${radius} a ${radius},${radius} 0 1,1 0,${radius * 2} a ${radius},${radius} 0 1,1 0,-${radius * 2}`;
        }
        return `M ${centerX},${centerY} L ${centerX},${centerY - radius} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))' }}
                >
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        fill={bgColor}
                        opacity="0.2"
                    />

                    <path
                        d={createPiePath()}
                        fill={color}
                        style={{
                            transition: animated ? 'all 1s ease-out' : 'none'
                        }}
                    />
                </svg>

                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        {showPercentage && (
                            <div
                                style={{
                                    fontSize: size * 0.18,
                                    fontWeight: '700',
                                    fontFamily: 'var(--font-family-mono)',
                                    color: 'var(--color-text-primary)',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {Math.round(displayProgress)}%
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {label && (
                <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    fontWeight: '600',
                    letterSpacing: '0.025em'
                }}>
                    {label}
                </div>
            )}
        </div>
    );
};

ProgressRing.propTypes = {
    progress: PropTypes.number,
    size: PropTypes.number,
    strokeWidth: PropTypes.number,
    label: PropTypes.string,
    color: PropTypes.string,
    bgColor: PropTypes.string,
    showPercentage: PropTypes.bool,
    animated: PropTypes.bool,
};

export default ProgressRing;
