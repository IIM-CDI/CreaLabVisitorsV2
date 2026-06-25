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
        <div
            className={`badge ${label} ${selected ? 'selected' : ''}`}
            style={{
                backgroundColor: color,
                outline: selected ? '2px solid #000' : 'none',
            }}
            onClick={onClick}
        >
            <p>{label}</p>
        </div>
    );
};

export default Badge;
