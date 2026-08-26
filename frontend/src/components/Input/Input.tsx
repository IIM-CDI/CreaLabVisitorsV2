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
    step?: React.InputHTMLAttributes<HTMLInputElement>['step'];
    onTimeBlur?: () => void;
    onChange: (value: string) => void;
}

const Input = ({
    label,
    value,
    type = 'text',
    required = false,
    placeholder = '',
    className = '',
    step,
    onTimeBlur,
    onChange,
}: InputProps) => {
    const inputId = React.useId();
    const handleBlur = () => {
        if (type === 'time') {
            onTimeBlur?.();
        }
    };

    return (
        <div className={`text-input ${className}`}>
            <label className="text-input-label" htmlFor={inputId}>
                {label}{' '}
                {required && <span className="text-input-required">*</span>}
            </label>
            <input
                id={inputId}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                onBlur={handleBlur}
                className="text-input-field"
                required={required}
                step={step}
            />
        </div>
    );
};

export default Input;
