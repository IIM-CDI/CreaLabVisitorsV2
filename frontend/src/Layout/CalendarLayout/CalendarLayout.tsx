import React, { useState, useEffect, useCallback } from 'react';
import Fullcalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import frLocale from '@fullcalendar/core/locales/fr';
import './CalendarLayout.css';

import ModalValidateEvent from '../../components/ModalValidateEvent/ModalValidateEvent';
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

const normalizeEmail = (email?: string) => (email ?? '').trim().toLowerCase();

const CalendarLayout = ({ user }: CalendarLayoutProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
    const [viewEventsScope, setViewEventsScope] =
        useState<ViewEventsScope | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(
        null
    );
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [clickedTime, setClickedTime] = useState<string | null>(null);
    const { getApiUrl, getHeaders } = useApi();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCompactCalendar, setIsCompactCalendar] = useState(false);
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

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
            setClickedTime(info.dateStr);
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

    const isViewModalOpen = viewEventsScope !== null;
    const viewEventButtons: Array<{ scope: ViewEventsScope; text: string }> = [
        { scope: 'mine', text: 'Mes événements' },
        ...(isAdmin
            ? [{ scope: 'all' as const, text: 'Tous les événements' }]
            : []),
    ];
    const canDeleteEvent = useCallback(
        (event: Pick<CalendarEvent, 'userMail'>) =>
            isAdmin || normalizeEmail(event.userMail) === normalizeEmail(user.email),
        [isAdmin, user.email]
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

    return (
        <div className="calendar-layout">
            <div className="navbar">
                <div className="open-modal-create-event-button-container">
                    {viewEventButtons.map(({ scope, text }) => (
                        <Button
                            key={scope}
                            className="navbar-event-button"
                            component_type="secondary"
                            type="button"
                            text={text}
                            onClick={() => setViewEventsScope(scope)}
                            aria-haspopup="dialog"
                            aria-expanded={viewEventsScope === scope}
                        />
                    ))}
                    {isAdmin && (
                        <Button
                            className="navbar-event-button"
                            component_type="primary"
                            type="button"
                            text="Valider les événements"
                            onClick={() => setIsValidateModalOpen(true)}
                            aria-haspopup="dialog"
                            aria-expanded={isValidateModalOpen}
                        />
                    )}
                </div>
                <h1>Bienvenue au CreaLab {emailToName(user.email)}</h1>
                <Button
                    type="button"
                    component_type="danger"
                    onClick={handleDeconnect}
                    text="Déconnexion"
                />
            </div>
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
                />
            )}
            {isValidateModalOpen && (
                <ModalValidateEvent
                    isOpen={isValidateModalOpen}
                    onClose={() => setIsValidateModalOpen(false)}
                    eventInfo={events
                        .filter((event) => !event.accepted)
                        .map((event) => [event.id, event.title])}
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
                                        className="calendar-event-delete"
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handleDeleteEvent(eventToDelete);
                                        }}
                                        disabled={isDeleting}
                                        aria-label={`Supprimer l'événement ${arg.event.title}`}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    }}
                />
            </div>

            {!isModalOpen &&
                !isViewModalOpen &&
                !isValidateModalOpen &&
                !selectedEvent && (
                    <div className="open-modal-button-container">
                        <button
                            className="open-modal-button"
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                        >
                            +
                        </button>
                    </div>
                )}
            {isModalOpen && (
                <ModalCreateEvent
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userMail={user.email}
                    clickedTime={clickedTime}
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
