import React, { useMemo } from 'react';
import './ModalViewEvent.css';
import { useModalManager } from '../../hooks/useModelManager';
import Button from '../Button/Button';

interface ViewEvent {
    id: string;
    title: string;
    badge?: string;
    description?: string;
    user?: string;
    start: Date | string | null;
    end: Date | string | null;
    accepted?: boolean;
}

interface ModalViewEventProps {
    isOpen: boolean;
    onClose: () => void;
    events: ViewEvent[];
    userMail: string;
}

const getEventTime = (date: Date | string | null) => {
    if (!date) return null;

    const eventDate = date instanceof Date ? date : new Date(date);
    const time = eventDate.getTime();

    return Number.isNaN(time) ? null : time;
};

const formatEventDate = (date: Date | string | null) => {
    const time = getEventTime(date);

    if (time === null) return 'Non renseigné';

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
    }).format(new Date(time));
};

const ModalViewEvent = ({
    isOpen,
    onClose,
    events,
    userMail,
}: ModalViewEventProps) => {
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
    });

    const upcomingEvents = useMemo(() => {
        const now = Date.now();
        const normalizedUserName = userMail
            .split('@')[0]
            .split('.')
            .join('')
            .toLowerCase();

        return events
            .filter((event) => {
                const startTime = getEventTime(event.start);

                return (
                    event.user?.split(' ').join('').toLowerCase() ===
                        normalizedUserName &&
                    startTime !== null &&
                    startTime >= now
                );
            })
            .sort((eventA, eventB) => {
                const startA = getEventTime(eventA.start) ?? 0;
                const startB = getEventTime(eventB.start) ?? 0;

                return startA - startB;
            });
    }, [events, userMail]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-backdrop-view-event"
            onClick={handleBackdropClick}
        >
            <section
                className="modal-content-view-event"
                role="dialog"
                aria-modal="true"
                aria-labelledby="view-events-title"
            >
                <header className="view-events-header">
                    <div>
                        <h2 id="view-events-title">Mes événements à venir</h2>
                        <p>
                            {upcomingEvents.length}{' '}
                            {upcomingEvents.length > 1
                                ? 'événements'
                                : 'événement'}
                        </p>
                    </div>
                    <button
                        className="view-events-close"
                        type="button"
                        onClick={handleClose}
                        aria-label="Fermer mes événements"
                    >
                        ×
                    </button>
                </header>

                {upcomingEvents.length === 0 ? (
                    <p className="view-events-empty">
                        Aucun événement à venir.
                    </p>
                ) : (
                    <ul className="view-events-list">
                        {upcomingEvents.map((event) => (
                            <li key={event.id} className="view-event-item">
                                <div className="view-event-item-header">
                                    <h3>{event.title}</h3>
                                    <span
                                        className={
                                            event.accepted === false
                                                ? 'view-event-status view-event-status-pending'
                                                : 'view-event-status view-event-status-accepted'
                                        }
                                    >
                                        {event.accepted === false
                                            ? 'En attente'
                                            : 'Validé'}
                                    </span>
                                </div>

                                {event.badge && (
                                    <span className="view-event-badge">
                                        {event.badge}
                                    </span>
                                )}

                                <dl className="view-event-details">
                                    <div>
                                        <dt>Début</dt>
                                        <dd>{formatEventDate(event.start)}</dd>
                                    </div>
                                    <div>
                                        <dt>Fin</dt>
                                        <dd>{formatEventDate(event.end)}</dd>
                                    </div>
                                </dl>

                                <p className="view-event-description">
                                    {event.description || 'Sans description'}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="view-events-actions">
                    <Button
                        component_type="secondary"
                        type="button"
                        text="Fermer"
                        onClick={handleClose}
                    />
                </div>
            </section>
        </div>
    );
};

export default ModalViewEvent;
