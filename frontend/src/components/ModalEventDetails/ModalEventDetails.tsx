import React from 'react';
import './ModalEventDetails.css';
import { useModalManager } from '../../hooks/useModelManager';
import Button from '../Button/Button';

export interface EventDetails {
    id: string;
    title: string;
    badge?: string;
    description?: string;
    user?: string;
    userMail?: string;
    start: Date | null;
    end: Date | null;
    backgroundColor: string;
    textColor: string;
    accepted?: boolean;
}

interface ModalEventDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    event: EventDetails | null;
    canDelete: boolean;
    onDelete: () => void;
    isDeleting: boolean;
}

const formatEventDate = (date: Date | null) => {
    if (!date) return 'Non renseigné';

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
    }).format(date);
};

const ModalEventDetails = ({
    isOpen,
    onClose,
    event,
    canDelete,
    onDelete,
    isDeleting,
}: ModalEventDetailsProps) => {
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
    });

    if (!isOpen || !event) return null;

    const accentStyle = {
        '--event-accent-color': event.backgroundColor,
        '--event-accent-text-color': event.textColor,
    } as React.CSSProperties & {
        '--event-accent-color': string;
        '--event-accent-text-color': string;
    };

    const details = [
        { label: 'Début', value: formatEventDate(event.start) },
        { label: 'Fin', value: formatEventDate(event.end) },
        { label: 'Créé par', value: event.user || 'Non renseigné' },
        {
            label: 'Statut',
            value:
                event.accepted === false
                    ? 'En attente de validation'
                    : 'Validé',
        },
    ];

    return (
        <div
            className="modal-backdrop-event-details"
            onClick={handleBackdropClick}
        >
            <section
                className="modal-content-event-details"
                role="dialog"
                aria-modal="true"
                aria-labelledby="event-details-title"
                style={accentStyle}
            >
                <header className="event-details-header">
                    <button
                        className="event-details-close"
                        type="button"
                        onClick={handleClose}
                        aria-label="Fermer la fiche événement"
                    >
                        ×
                    </button>
                    <div className="event-details-heading">
                        <h2 id="event-details-title">{event.title}</h2>
                        {event.badge && (
                            <span className="event-details-badge">
                                {event.badge}
                            </span>
                        )}
                    </div>
                </header>

                <div className="event-details-body">
                    <div className="event-details-description">
                        <span>Description</span>
                        <p>{event.description || 'Non renseignée'}</p>
                    </div>

                    <dl className="event-details-list">
                        {details.map((detail) => (
                            <div
                                key={detail.label}
                                className="event-details-row"
                            >
                                <dt>{detail.label}</dt>
                                <dd>{detail.value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="event-details-actions">
                        {canDelete && (
                            <Button
                                component_type="danger"
                                type="button"
                                text={
                                    isDeleting ? 'Suppression...' : 'Supprimer'
                                }
                                onClick={onDelete}
                                disabled={isDeleting}
                                isLoading={isDeleting}
                            />
                        )}
                        <Button
                            component_type="secondary"
                            type="button"
                            text="Fermer"
                            onClick={handleClose}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ModalEventDetails;
