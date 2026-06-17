import { useEffect, useCallback } from 'react';

interface UseModalManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onEventChange?: () => void;
}

export const useModalManager = ({ isOpen, onClose, onEventChange }: UseModalManagerProps) => {
    const handleClose = useCallback(() => {
        onClose();
        if (onEventChange) onEventChange();
    }, [onClose, onEventChange]);

    const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }, [handleClose]);

    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleClose]);

    return { handleClose, handleBackdropClick };
};