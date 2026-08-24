import React from 'react';
import './Input.css';

interface InputProps {
    label: string;
    value: string;
    type?:
        | 'text'
        | 'password'
        | 'email'
        | 'datetime-local'
        | 'color'
        | 'date'
        | 'time';
    required?: boolean;
    placeholder?: string;
    className?: string;
    onChange: (value: string) => void;
}

const Input = ({
    label,
    value,
    type = 'text',
    required = false,
    placeholder = '',
    className = '',
    onChange,
}: InputProps) => {
    const inputId = React.useId();

    return (
        <div className={`text-input ${className}`}>
            <label className="text-input-label" htmlFor={inputId}>
                {label} {required && <span className="text-input-required">*</span>}
            </label>
            <input
                id={inputId}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="text-input-field"
                required={required}
            />
        </div>
    );
};

export default Input;
