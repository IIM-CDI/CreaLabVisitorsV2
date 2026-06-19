import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    component_type?: 'primary' | 'secondary' | 'accept' | 'danger';
    text: string;
    onClick?: () => void;
}

const Button = ({ component_type = 'primary', text, onClick }: ButtonProps) => {
    return (
        <button className={`button button-${component_type}`} onClick={onClick}>
            <p className="button-text">{text}</p>
        </button>
    );
};

export default Button;
