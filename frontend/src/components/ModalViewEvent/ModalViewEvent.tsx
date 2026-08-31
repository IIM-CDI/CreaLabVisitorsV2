import React, { useMemo, useState } from 'react';
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
type ViewEventStatusSort = 'date' | 'pending-first' | 'accepted-first';

const statusSortOptions: Array<{ value: ViewEventStatusSort; label: string }> =
    [
        { value: 'date', label: 'Date' },
        { value: 'pending-first', label: 'En attente' },
        { value: 'accepted-first', label: 'Validés' },
    ];

interface ModalViewEventProps {
    isOpen: boolean;
    onClose: () => void;
    events: ViewEvent[];
    userMail: string;
    scope: ViewEventScope;
    canDeleteEvent: (event: ViewEvent) => boolean;
    onDeleteEvent: (event: ViewEvent) => void;
    deletingEventId: string | null;
    canValidateEvent: (event: ViewEvent) => boolean;
    onValidateEvent: (event: ViewEvent) => void;
    validatingEventId: string | null;
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

const getStatusSortRank = (
    event: ViewEvent,
    statusSort: ViewEventStatusSort
) => {
    const isPending = event.accepted === false;

    if (statusSort === 'pending-first') return isPending ? 0 : 1;
    if (statusSort === 'accepted-first') return isPending ? 1 : 0;

    return 0;
};

const ModalViewEvent = ({
    isOpen,
    onClose,
    events,
    userMail,
    scope,
    canDeleteEvent,
    onDeleteEvent,
    deletingEventId,
    canValidateEvent,
    onValidateEvent,
    validatingEventId,
}: ModalViewEventProps) => {
    const [statusSort, setStatusSort] = useState<ViewEventStatusSort>('date');
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

        return events.filter((event) => {
            const startTime = getEventTime(event.start);

            if (startTime === null || startTime < now) return false;

            const belongsToUser =
                normalizeEmail(event.userMail) === normalizedUserMail ||
                (!event.userMail && getUserKey(event.user ?? '') === userKey);

            return isAllEventsView || belongsToUser;
        });
    }, [events, isAllEventsView, userMail]);

    const sortedEvents = useMemo(() => {
        return [...upcomingEvents].sort((eventA, eventB) => {
            const statusRankA = getStatusSortRank(eventA, statusSort);
            const statusRankB = getStatusSortRank(eventB, statusSort);

            if (statusRankA !== statusRankB) return statusRankA - statusRankB;

            const startA = getEventTime(eventA.start) ?? 0;
            const startB = getEventTime(eventB.start) ?? 0;

            return startA - startB;
        });
    }, [statusSort, upcomingEvents]);

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

                {upcomingEvents.length > 0 && (
                    <div
                        className="view-events-sort"
                        role="group"
                        aria-label="Trier les événements"
                    >
                        {statusSortOptions.map(({ value, label }) => (
                            <button
                                key={value}
                                className={`view-events-sort-button ${
                                    statusSort === value
                                        ? 'view-events-sort-button-active'
                                        : ''
                                }`.trim()}
                                type="button"
                                onClick={() => setStatusSort(value)}
                                aria-pressed={statusSort === value}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {upcomingEvents.length === 0 ? (
                    <p className="view-events-empty">
                        Aucun événement à venir.
                    </p>
                ) : (
                    <ul className="view-events-list">
                        {sortedEvents.map((event) => {
                            const isDeleting = deletingEventId === event.id;
                            const isValidating = validatingEventId === event.id;
                            const canDelete = canDeleteEvent(event);
                            const canValidate = canValidateEvent(event);
                            const isCurrentEventBusy =
                                isDeleting || isValidating;

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
                                            <dd>
                                                {formatEventDate(event.end)}
                                            </dd>
                                        </div>
                                    </dl>

                                    <p className="view-event-description">
                                        {event.description ||
                                            'Sans description'}
                                    </p>

                                    {(canDelete || canValidate) && (
                                        <div className="view-event-item-actions">
                                            {canValidate && (
                                                <Button
                                                    component_type="accept"
                                                    type="button"
                                                    text={
                                                        isValidating
                                                            ? 'Validation...'
                                                            : 'Valider'
                                                    }
                                                    onClick={() =>
                                                        onValidateEvent(event)
                                                    }
                                                    disabled={
                                                        isCurrentEventBusy
                                                    }
                                                    isLoading={isValidating}
                                                />
                                            )}
                                            {canDelete && (
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
                                                    disabled={
                                                        isCurrentEventBusy
                                                    }
                                                    isLoading={isDeleting}
                                                />
                                            )}
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
