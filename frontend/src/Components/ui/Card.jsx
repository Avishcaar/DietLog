import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/globals.css';

const Card = ({
    children,
    variant = 'default',
    hover = true,
    className = '',
    ...props
}) => {
    const baseStyles = 'rounded-xl transition-all duration-300';

    const variants = {
        default: 'card bg-[var(--color-surface)] shadow-[var(--shadow-md)]',
        glass: 'card-glass',
        outlined: 'border-2 border-[var(--color-border)] bg-transparent',
        elevated: 'bg-[var(--color-surface)] shadow-[var(--shadow-xl)]',
    };

    const hoverClass = hover ? 'hover-lift cursor-pointer' : '';
    const variantClass = variants[variant] || variants.default;

    return (
        <div
            className={`${baseStyles} ${variantClass} ${hoverClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

Card.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['default', 'glass', 'outlined', 'elevated']),
    hover: PropTypes.bool,
    className: PropTypes.string,
};

export default Card;
