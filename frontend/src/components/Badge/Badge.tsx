import React from 'react';
import './Badge.css';

interface BadgeProps {
    label: string;
    color?: string;
    selected?: boolean;
    onClick?: () => void;
    customLabel?: string;
    onCustomLabelChange?: (value: string) => void;
}

const PencilIcon = () => (
    <svg
        className="badge-edit-icon"
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
    >
        <path d="M4 13.9V16h2.1l8-8-2.1-2.1-8 8Z" />
        <path d="m13 4.9 1.1-1.1a1.4 1.4 0 0 1 2 2L15 6.9l-2-2Z" />
    </svg>
);

const Badge = ({
    label,
    selected,
    color,
    onClick,
    customLabel,
    onCustomLabelChange,
}: BadgeProps) => {
    const isCustomBadge = label.toLowerCase() === 'autre';
    const badgeClassName = [
        'badge',
        selected ? 'selected' : '',
        isCustomBadge ? 'badge-custom' : '',
    ]
        .filter(Boolean)
        .join(' ');
    const badgeStyle = {
        backgroundColor: color,
    };

    if (isCustomBadge && selected) {
        return (
            <div
                className={`${badgeClassName} badge-editable`}
                style={badgeStyle}
                role="group"
                aria-label="Badge personnalisé"
                onClick={onClick}
            >
                <input
                    className="badge-input"
                    type="text"
                    value={customLabel ?? ''}
                    placeholder="Préciser le label"
                    onChange={(event) =>
                        onCustomLabelChange?.(event.target.value)
                    }
                    onFocus={onClick}
                    aria-label="Modifier le label du badge"
                    autoFocus
                />
                <PencilIcon />
            </div>
        );
    }

    return (
        <button
            type="button"
            className={badgeClassName}
            style={badgeStyle}
            onClick={onClick}
            aria-pressed={selected}
            aria-label={
                isCustomBadge ? 'Autre, préciser un label personnalisé' : label
            }
        >
            {isCustomBadge ? (
                <span className="badge-custom-content">
                    <span className="badge-custom-label">
                        {label}
                        <PencilIcon />
                    </span>
                    <span className="badge-custom-hint">à préciser</span>
                </span>
            ) : (
                <p>{label}</p>
            )}
        </button>
    );
};

export default Badge;
