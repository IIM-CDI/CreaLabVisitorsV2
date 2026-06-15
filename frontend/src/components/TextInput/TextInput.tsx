import React from 'react';
import './TextInput.css';

interface TextInputProps {
    label: string;
    value: string;
    defaultValue?: string;
    type?: 'text' | 'password' | 'email';
    required?: boolean;
    placeholder?: string;
    className?: string;
    onChange: (value: string) => void;
}

const TextInput = ({
    label,
    value,
    defaultValue = '',
    type = 'text',
    required = false,
    placeholder = '',
    className = '',
    onChange,
}: TextInputProps) => {
    return (
        <div className={`text-input ${className}`}>
            <label className="text-input-label">{label}</label>
            <input
                type={type}
                value={value}
                defaultValue={defaultValue}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="text-input-field"
                required={required}
            />
        </div>
    );
};

export default TextInput;
