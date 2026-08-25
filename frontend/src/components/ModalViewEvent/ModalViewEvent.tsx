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
    userMail?: string;
    start: Date | string | null;
    end: Date | string | null;
    accepted?: boolean;
}

type ViewEventScope = 'mine' | 'all';

interface ModalViewEventProps {
    isOpen: boolean;
    onClose: () => void;
    events: ViewEvent[];
    userMail: string;
    scope: ViewEventScope;
    canDeleteEvent: (event: ViewEvent) => boolean;
    onDeleteEvent: (event: ViewEvent) => void;
    deletingEventId: string | null;
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

const getUserKey = (value: string) =>
    value.split('@')[0].replace(/[.\s]/g, '').toLowerCase();

const normalizeEmail = (email?: string) => (email ?? '').trim().toLowerCase();

const ModalViewEvent = ({
    isOpen,
    onClose,
    events,
    userMail,
    scope,
    canDeleteEvent,
    onDeleteEvent,
    deletingEventId,
}: ModalViewEventProps) => {
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
    });

    const isAllEventsView = scope === 'all';
    const title = isAllEventsView
        ? 'Tous les événements à venir'
        : 'Mes événements à venir';

    const upcomingEvents = useMemo(() => {
        const now = Date.now();
        const userKey = getUserKey(userMail);
        const normalizedUserMail = normalizeEmail(userMail);

        return events
            .filter((event) => {
                const startTime = getEventTime(event.start);

                if (startTime === null || startTime < now) return false;

                const belongsToUser =
                    normalizeEmail(event.userMail) === normalizedUserMail ||
                    (!event.userMail &&
                        getUserKey(event.user ?? '') === userKey);

                return isAllEventsView || belongsToUser;
            })
            .sort((eventA, eventB) => {
                const startA = getEventTime(eventA.start) ?? 0;
                const startB = getEventTime(eventB.start) ?? 0;

                return startA - startB;
            });
    }, [events, isAllEventsView, userMail]);

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
                        <h2 id="view-events-title">{title}</h2>
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
                        aria-label="Fermer la liste des événements"
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
                        {upcomingEvents.map((event) => {
                            const isDeleting = deletingEventId === event.id;

                            return (
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
                                        {isAllEventsView && event.user && (
                                            <div>
                                                <dt>Créateur</dt>
                                                <dd>{event.user}</dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt>Début</dt>
                                            <dd>
                                                {formatEventDate(event.start)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Fin</dt>
                                            <dd>{formatEventDate(event.end)}</dd>
                                        </div>
                                    </dl>

                                    <p className="view-event-description">
                                        {event.description ||
                                            'Sans description'}
                                    </p>

                                    {canDeleteEvent(event) && (
                                        <div className="view-event-item-actions">
                                            <Button
                                                component_type="danger"
                                                type="button"
                                                text={
                                                    isDeleting
                                                        ? 'Suppression...'
                                                        : 'Supprimer'
                                                }
                                                onClick={() =>
                                                    onDeleteEvent(event)
                                                }
                                                disabled={isDeleting}
                                            />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
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
