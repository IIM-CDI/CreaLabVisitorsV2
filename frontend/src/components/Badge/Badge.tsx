import React from 'react';
import './Badge.css';

interface BadgeProps {
    label: string;
    color?: string;
    selected?: boolean;
    onClick?: () => void;
}

const Badge = ({ label, selected, color, onClick }: BadgeProps) => {
    return (
        <button
            type="button"
            className={`badge ${selected ? 'selected' : ''}`.trim()}
            style={{
                backgroundColor: color,
            }}
            onClick={onClick}
            aria-pressed={selected}
        >
            <p>{label}</p>
        </button>
    );
};

export default Badge;
