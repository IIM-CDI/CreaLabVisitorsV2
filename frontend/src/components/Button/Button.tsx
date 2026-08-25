import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    component_type?: 'primary' | 'secondary' | 'accept' | 'danger';
    text: string;
    onClick?: () => void;
    isLoading?: boolean;
}

const Button = ({
    component_type = 'primary',
    text,
    onClick,
    isLoading = false,
    disabled,
    type = 'button',
    className = '',
    'aria-busy': ariaBusy,
    ...buttonProps
}: ButtonProps) => {
    const isBusy = isLoading || ariaBusy === true || ariaBusy === 'true';

    return (
        <button
            {...buttonProps}
            className={`button button-${component_type} ${
                isLoading ? 'button-loading' : ''
            } ${className}`.trim()}
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            aria-busy={isBusy || undefined}
        >
            {isLoading && (
                <span className="button-spinner" aria-hidden="true" />
            )}
            <p className="button-text">{text}</p>
        </button>
    );
};

export default Button;
