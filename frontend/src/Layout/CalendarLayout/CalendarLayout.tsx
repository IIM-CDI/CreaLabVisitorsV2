import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Fullcalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import frLocale from '@fullcalendar/core/locales/fr';
import './CalendarLayout.css';

import ModalCreateEvent from '../../components/ModalCreateEvent/ModalCreateEvent';
import ModalEventDetails, {
    EventDetails,
} from '../../components/ModalEventDetails/ModalEventDetails';
import ModalViewEvent from '../../components/ModalViewEvent/ModalViewEvent';
import Button from '../../components/Button/Button';
import { useApi } from '../../hooks/useAPI';

interface CalendarLayoutProps {
    user: { email: string };
}

type ViewEventsScope = 'mine' | 'all';

interface CalendarSelection {
    start: string;
    end?: string;
}

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    badge?: string;
    user?: string;
    userMail?: string;
    start: string;
    end: string;
    accepted?: boolean;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    timezone: string;
}

type DeletableEvent = Pick<CalendarEvent, 'id' | 'title' | 'userMail'>;
type ValidatableEvent = Pick<CalendarEvent, 'id' | 'title' | 'accepted'>;

const normalizeEmail = (email?: string) => (email ?? '').trim().toLowerCase();
const DATE_ONLY_VALUE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_VIEW_TYPE = 'dayGridMonth';
const MULTI_DAY_MONTH_START_TIME = '09:00';
const MULTI_DAY_MONTH_END_TIME = '17:00';

interface FullCalendarSelectionInfo {
    startStr: string;
    endStr?: string;
    allDay?: boolean;
    view?: {
        type?: string;
    };
}

const isDateOnlyValue = (value?: string): value is string =>
    typeof value === 'string' && DATE_ONLY_VALUE.test(value);

const shiftDateOnlyValue = (dateValue: string, dayDelta: number) => {
    const [year, month, day] = dateValue.split('-').map(Number);
    const shiftedDate = new Date(Date.UTC(year, month - 1, day + dayDelta));

    return shiftedDate.toISOString().slice(0, 10);
};

const buildDateTimeSelectionValue = (date: string, time: string) =>
    `${date}T${time}`;

const buildCalendarSelection = (
    info: FullCalendarSelectionInfo
): CalendarSelection => {
    if (
        info.view?.type !== MONTH_VIEW_TYPE ||
        !info.allDay ||
        !isDateOnlyValue(info.startStr) ||
        !isDateOnlyValue(info.endStr)
    ) {
        return {
            start: info.startStr,
            end: info.endStr,
        };
    }

    const inclusiveEndDate = shiftDateOnlyValue(info.endStr, -1);

    if (inclusiveEndDate <= info.startStr) {
        return {
            start: info.startStr,
            end: info.endStr,
        };
    }

    return {
        start: buildDateTimeSelectionValue(
            info.startStr,
            MULTI_DAY_MONTH_START_TIME
        ),
        end: buildDateTimeSelectionValue(
            inclusiveEndDate,
            MULTI_DAY_MONTH_END_TIME
        ),
    };
};

const getEventTime = (date: Date | string | null) => {
    if (!date) return null;

    const eventDate = date instanceof Date ? date : new Date(date);
    const time = eventDate.getTime();

    return Number.isNaN(time) ? null : time;
};

const getUserKey = (value: string) =>
    value.split('@')[0].replace(/[.\s]/g, '').toLowerCase();

const eventBelongsToUser = (
    event: Pick<CalendarEvent, 'user' | 'userMail'>,
    userMail: string
) =>
    normalizeEmail(event.userMail) === normalizeEmail(userMail) ||
    (!event.userMail && getUserKey(event.user ?? '') === getUserKey(userMail));

const formatPendingValidationLabel = (count: number) =>
    `${count} événement${count > 1 ? 's' : ''} à valider`;

const CalendarLayout = ({ user }: CalendarLayoutProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewEventsScope, setViewEventsScope] =
        useState<ViewEventsScope | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(
        null
    );
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendarSelection, setCalendarSelection] =
        useState<CalendarSelection | null>(null);
    const { getApiUrl, getHeaders } = useApi();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCompactCalendar, setIsCompactCalendar] = useState(false);
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
    const [validatingEventId, setValidatingEventId] = useState<string | null>(
        null
    );
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

    const checkAdminStatus = useCallback(async () => {
        const response = await fetch(`${getApiUrl()}/user/${user.email}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();
        console.log('Admin status:', data);
        setIsAdmin(data.user.admin);
    }, [getApiUrl, getHeaders, user.email]);

    useEffect(() => {
        checkAdminStatus();
    }, [checkAdminStatus]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 700px)');
        const updateCalendarDensity = () => {
            setIsCompactCalendar(mediaQuery.matches);
        };

        updateCalendarDensity();
        mediaQuery.addEventListener('change', updateCalendarDensity);

        return () => {
            mediaQuery.removeEventListener('change', updateCalendarDensity);
        };
    }, []);

    const emailToName = (email: string) => {
        const namePart = email.split('@')[0];
        const nameWithSpaces = namePart.replace('.', ' ');
        return nameWithSpaces
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const calendarConfig = {
        headerToolbar: isCompactCalendar
            ? {
                  left: 'prev,next',
                  center: 'title',
                  right: 'today timeGridDay,dayGridMonth',
              }
            : {
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridDay,timeGridWeek,dayGridMonth',
              },
        buttonText: {
            today: isCompactCalendar ? 'Auj.' : "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
        },
        initialView: isCompactCalendar ? 'timeGridDay' : 'timeGridWeek',
        firstDay: 1,
        slotLabelFormat: {
            hour: '2-digit' as const,
            minute: '2-digit' as const,
            hour12: false as const,
        },
        eventTimeFormat: {
            hour: '2-digit' as const,
            minute: '2-digit' as const,
            hour12: false as const,
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        allDaySlot: false,
        editable: false,
        selectable: true,
        weekends: false,
        locale: frLocale,
        eventDisplay: 'block' as const,
        dayMaxEvents: isCompactCalendar ? 2 : true,
        dateClick: (info: any) => {
            setCalendarSelection({ start: info.dateStr });
            setIsModalOpen(true);
        },
        select: (info: any) => {
            setCalendarSelection(buildCalendarSelection(info));
            setIsModalOpen(true);
        },
        eventClick: (info: any) => {
            const { event } = info;

            setSelectedEvent({
                id: event.id,
                title: event.title,
                badge: event.extendedProps.badge,
                description: event.extendedProps.description,
                user: event.extendedProps.user,
                userMail: event.extendedProps.userMail,
                start: event.start,
                end: event.end,
                backgroundColor: event.backgroundColor || '#c4c4c4',
                textColor: event.textColor || '#ffffff',
                accepted: event.extendedProps.accepted,
            });
        },
        timeZone: 'Europe/Paris' as const,
    };

    const darkOrLight = (red: number, green: number, blue: number) => {
        let brightness = red * 299 + green * 587 + blue * 114;
        brightness /= 255000;
        return brightness >= 0.5 ? '#000000' : '#ffffff';
    };

    const fetchEvents = useCallback(async () => {
        const response = await fetch(`${getApiUrl()}/events/`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();

        const events = data.events.map((event: any) => ({
            id: String(event.id),
            title: event.title,
            description: event.description,
            badge: event.badge,
            user: event.user,
            userMail: event.user_mail,
            start: event.startStr || event.start || '',
            end: event.endStr || event.end || '',
            accepted: event.accepted,
            backgroundColor: event.accepted ? event.color : '#c4c4c4',
            borderColor: event.accepted ? event.color : '#c4c4c4',
            textColor: darkOrLight(
                parseInt(event.color.slice(1, 3), 16),
                parseInt(event.color.slice(3, 5), 16),
                parseInt(event.color.slice(5, 7), 16)
            ),
            timezone: 'Europe/Paris',
        }));

        setEvents(events);
        return events;
    }, [getApiUrl, getHeaders]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents, isModalOpen]);

    const handleDeconnect = () => {
        localStorage.setItem('user', JSON.stringify(null));
        window.location.reload();
    };

    async function autoDeconnect() {
        localStorage.removeItem('user');
        window.location.reload();
    }

    useEffect(() => {
        const interval = setInterval(autoDeconnect, 600_000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsActionMenuOpen(false);
            }
        };

        if (isActionMenuOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isActionMenuOpen]);

    const closeCreateEventModal = () => {
        setIsModalOpen(false);
        setCalendarSelection(null);
    };

    const isViewModalOpen = viewEventsScope !== null;
    const pendingValidationCounts = useMemo(() => {
        const counts = { mine: 0, all: 0 };

        if (!isAdmin) return counts;

        const now = Date.now();

        events.forEach((event) => {
            const startTime = getEventTime(event.start);

            if (
                event.accepted !== false ||
                startTime === null ||
                startTime < now
            ) {
                return;
            }

            counts.all += 1;

            if (eventBelongsToUser(event, user.email)) {
                counts.mine += 1;
            }
        });

        return counts;
    }, [events, isAdmin, user.email]);
    const hasPendingValidation = pendingValidationCounts.all > 0;
    const viewEventButtons: Array<{
        scope: ViewEventsScope;
        text: string;
        pendingValidationCount: number;
    }> = [
        {
            scope: 'mine',
            text: 'Mes événements',
            pendingValidationCount: pendingValidationCounts.mine,
        },
        ...(isAdmin
            ? [
                  {
                      scope: 'all' as const,
                      text: 'Tous les événements',
                      pendingValidationCount: pendingValidationCounts.all,
                  },
              ]
            : []),
    ];
    const canDeleteEvent = useCallback(
        (event: Pick<CalendarEvent, 'userMail'>) =>
            isAdmin ||
            normalizeEmail(event.userMail) === normalizeEmail(user.email),
        [isAdmin, user.email]
    );
    const canValidateEvent = useCallback(
        (event: Pick<CalendarEvent, 'accepted'>) =>
            isAdmin && event.accepted === false,
        [isAdmin]
    );

    const handleDeleteEvent = useCallback(
        async (eventToDelete: DeletableEvent) => {
            if (deletingEventId) return;

            if (!canDeleteEvent(eventToDelete)) {
                window.alert(
                    'Vous ne pouvez supprimer que vos propres événements.'
                );
                return;
            }

            const confirmed = window.confirm(
                `Supprimer "${eventToDelete.title}" ? Un mail d'annulation avec un fichier ICS sera envoyé.`
            );

            if (!confirmed) return;

            setDeletingEventId(eventToDelete.id);

            try {
                const query = new URLSearchParams({
                    requester_email: user.email,
                });
                const response = await fetch(
                    `${getApiUrl()}/event/${eventToDelete.id}?${query}`,
                    {
                        method: 'DELETE',
                        headers: getHeaders(),
                    }
                );

                if (!response.ok) {
                    let message = "La suppression de l'événement a échoué.";

                    try {
                        const data = await response.json();
                        message = data.detail || message;
                    } catch {
                        // Keep the generic message when the backend returns no JSON.
                    }

                    window.alert(message);
                    return;
                }

                setEvents((currentEvents) =>
                    currentEvents.filter(
                        (event) => event.id !== eventToDelete.id
                    )
                );
                setSelectedEvent((currentEvent) =>
                    currentEvent?.id === eventToDelete.id ? null : currentEvent
                );
                await fetchEvents();
            } finally {
                setDeletingEventId(null);
            }
        },
        [
            canDeleteEvent,
            deletingEventId,
            fetchEvents,
            getApiUrl,
            getHeaders,
            user.email,
        ]
    );

    const handleValidateEvent = useCallback(
        async (eventToValidate: ValidatableEvent) => {
            if (validatingEventId) return;

            if (!canValidateEvent(eventToValidate)) return;

            setValidatingEventId(eventToValidate.id);

            try {
                const response = await fetch(
                    `${getApiUrl()}/event/validate/${eventToValidate.id}`,
                    {
                        method: 'PUT',
                        headers: getHeaders(),
                    }
                );

                if (!response.ok) {
                    let message = "La validation de l'événement a échoué.";

                    try {
                        const data = await response.json();
                        message = data.detail || message;
                    } catch {
                        // Keep the generic message when the backend returns no JSON.
                    }

                    window.alert(message);
                    return;
                }

                setEvents((currentEvents) =>
                    currentEvents.map((event) =>
                        event.id === eventToValidate.id
                            ? { ...event, accepted: true }
                            : event
                    )
                );
                setSelectedEvent((currentEvent) =>
                    currentEvent?.id === eventToValidate.id
                        ? { ...currentEvent, accepted: true }
                        : currentEvent
                );
                await fetchEvents();
            } finally {
                setValidatingEventId(null);
            }
        },
        [
            canValidateEvent,
            fetchEvents,
            getApiUrl,
            getHeaders,
            validatingEventId,
        ]
    );

    return (
        <div className="calendar-layout">
            <div className="navbar">
                <div className="navbar-menu-slot">
                    <button
                        className="navbar-menu-button"
                        type="button"
                        onClick={() => setIsActionMenuOpen(true)}
                        aria-label={
                            hasPendingValidation
                                ? `Ouvrir le menu (${formatPendingValidationLabel(
                                      pendingValidationCounts.all
                                  )})`
                                : 'Ouvrir le menu'
                        }
                        aria-haspopup="dialog"
                        aria-controls="calendar-action-menu"
                        aria-expanded={isActionMenuOpen}
                    >
                        <span
                            className="navbar-menu-button-line"
                            aria-hidden="true"
                        />
                        <span
                            className="navbar-menu-button-line"
                            aria-hidden="true"
                        />
                        <span
                            className="navbar-menu-button-line"
                            aria-hidden="true"
                        />
                        {hasPendingValidation && (
                            <span
                                className="pending-validation-badge navbar-menu-validation-badge"
                                aria-hidden="true"
                            >
                                {pendingValidationCounts.all}
                            </span>
                        )}
                    </button>
                </div>
                <h1>Bienvenue au CreaLab {emailToName(user.email)}</h1>
                <Button
                    type="button"
                    component_type="danger"
                    onClick={handleDeconnect}
                    text="Déconnexion"
                />
            </div>
            {isActionMenuOpen && (
                <div
                    className="action-menu-backdrop"
                    onClick={() => setIsActionMenuOpen(false)}
                >
                    <aside
                        id="calendar-action-menu"
                        className="action-menu-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="calendar-action-menu-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="action-menu-header">
                            <h2 id="calendar-action-menu-title">Menu</h2>
                            <button
                                className="action-menu-close"
                                type="button"
                                onClick={() => setIsActionMenuOpen(false)}
                                aria-label="Fermer le menu"
                            >
                                ×
                            </button>
                        </header>
                        <div className="action-menu-buttons">
                            {viewEventButtons.map(
                                ({ scope, text, pendingValidationCount }) => (
                                    <div
                                        key={scope}
                                        className="view-event-button-wrapper"
                                    >
                                        <Button
                                            component_type="secondary"
                                            type="button"
                                            text={text}
                                            onClick={() => {
                                                setIsActionMenuOpen(false);
                                                setViewEventsScope(scope);
                                            }}
                                            aria-haspopup="dialog"
                                            aria-expanded={
                                                viewEventsScope === scope
                                            }
                                            aria-label={
                                                pendingValidationCount > 0
                                                    ? `${text} (${formatPendingValidationLabel(
                                                          pendingValidationCount
                                                      )})`
                                                    : undefined
                                            }
                                        />
                                        {pendingValidationCount > 0 && (
                                            <span
                                                className="pending-validation-badge view-event-validation-badge"
                                                aria-hidden="true"
                                            >
                                                {pendingValidationCount}
                                            </span>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </aside>
                </div>
            )}
            {viewEventsScope && (
                <ModalViewEvent
                    isOpen={true}
                    onClose={() => setViewEventsScope(null)}
                    events={events}
                    userMail={user.email}
                    scope={viewEventsScope}
                    canDeleteEvent={canDeleteEvent}
                    onDeleteEvent={handleDeleteEvent}
                    deletingEventId={deletingEventId}
                    canValidateEvent={canValidateEvent}
                    onValidateEvent={handleValidateEvent}
                    validatingEventId={validatingEventId}
                />
            )}

            <div className="calendar-container">
                <Fullcalendar
                    key={
                        isCompactCalendar ? 'compact-calendar' : 'wide-calendar'
                    }
                    plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                        momentTimezonePlugin,
                    ]}
                    {...calendarConfig}
                    events={events}
                    eventContent={(arg) => {
                        const eventToDelete = {
                            id: arg.event.id,
                            title: arg.event.title,
                            userMail: arg.event.extendedProps.userMail,
                        };
                        const isDeleting = deletingEventId === arg.event.id;

                        return (
                            <div className="calendar-event-content">
                                <div className="calendar-event-text">
                                    <div className="fc-event-title">
                                        {arg.event.title}
                                    </div>
                                    <div className="fc-event-badge">
                                        {arg.event.extendedProps.badge}
                                    </div>
                                </div>
                                {canDeleteEvent(eventToDelete) && (
                                    <button
                                        className={`calendar-event-delete ${
                                            isDeleting
                                                ? 'calendar-event-delete-loading'
                                                : ''
                                        }`.trim()}
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handleDeleteEvent(eventToDelete);
                                        }}
                                        disabled={isDeleting}
                                        aria-label={
                                            isDeleting
                                                ? `Suppression de l'événement ${arg.event.title}`
                                                : `Supprimer l'événement ${arg.event.title}`
                                        }
                                    >
                                        {isDeleting ? (
                                            <span
                                                className="calendar-event-delete-spinner"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            '×'
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    }}
                />
            </div>

            {!isModalOpen &&
                !isViewModalOpen &&
                !isActionMenuOpen &&
                !selectedEvent && (
                    <div className="open-modal-button-container">
                        <button
                            className="open-modal-button"
                            type="button"
                            onClick={() => {
                                setCalendarSelection(null);
                                setIsModalOpen(true);
                            }}
                        >
                            +
                        </button>
                    </div>
                )}
            {isModalOpen && (
                <ModalCreateEvent
                    isOpen={isModalOpen}
                    onClose={closeCreateEventModal}
                    userMail={user.email}
                    initialSelection={calendarSelection}
                />
            )}
            {selectedEvent && (
                <ModalEventDetails
                    isOpen={selectedEvent !== null}
                    onClose={() => setSelectedEvent(null)}
                    event={selectedEvent}
                    canDelete={canDeleteEvent(selectedEvent)}
                    onDelete={() => handleDeleteEvent(selectedEvent)}
                    isDeleting={deletingEventId === selectedEvent.id}
                />
            )}
        </div>
    );
};

export default CalendarLayout;
