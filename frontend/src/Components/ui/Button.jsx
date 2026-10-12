import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/globals.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const baseStyles = 'btn-press inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const variants = {
        primary: 'gradient-primary text-white hover:shadow-lg hover:scale-105',
        secondary: 'gradient-secondary text-white hover:shadow-lg hover:scale-105',
        outline: 'border-2 border-current hover:bg-current hover:text-white',
        ghost: 'hover:bg-[var(--color-surface-hover)]',
        danger: 'bg-[var(--color-error)] text-white hover:opacity-90',
    };

    const sizes = {
        small: 'text-sm px-3 py-1.5 rounded-lg',
        medium: 'text-base px-4 py-2.5 rounded-xl',
        large: 'text-lg px-6 py-3 rounded-xl',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.medium;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Loading...
                </>
            ) : (
                <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    fullWidth: PropTypes.bool,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    leftIcon: PropTypes.node,
    rightIcon: PropTypes.node,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    className: PropTypes.string,
};

export default Button;
