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
import Button from '../../components/Button/Button';
import { useApi } from '../../hooks/useAPI';

interface CalendarLayoutProps {
    user: { email: string };
}

const CalendarLayout = ({ user }: CalendarLayoutProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(
        null
    );
    const [events, setEvents] = useState<any[]>([]);
    const [clickedTime, setClickedTime] = useState<string | null>(null);
    const { getApiUrl, getHeaders } = useApi();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCompactCalendar, setIsCompactCalendar] = useState(false);

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
            id: event.id,
            title: event.title,
            description: event.description,
            badge: event.badge,
            user: event.user,
            start: event.startStr,
            end: event.endStr,
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

    return (
        <div className="calendar-layout">
            <div className="navbar">
                <div className="open-modal-create-event-button-container">
                    {isAdmin && (
                        <Button
                            component_type="primary"
                            type="button"
                            text="Valider les événements"
                            onClick={() => setIsValidateModalOpen(true)}
                        />
                    )}
                </div>
                {isValidateModalOpen && (
                    <ModalValidateEvent
                        isOpen={isValidateModalOpen}
                        onClose={() => setIsValidateModalOpen(false)}
                        eventInfo={events
                            .filter((event) => !event.accepted)
                            .map((event) => [event.id, event.title])}
                    />
                )}
                <h1>Bienvenue au CreaLab {emailToName(user.email)}</h1>
                <Button
                    type="button"
                    component_type="danger"
                    onClick={handleDeconnect}
                    text="Déconnexion"
                />
            </div>

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
                    eventContent={(arg) => (
                        <div className="fc-event-content">
                            <div className="fc-event-title">
                                {arg.event.title}
                            </div>
                            <div className="fc-event-badge">
                                {arg.event.extendedProps.badge}
                            </div>
                        </div>
                    )}
                />
            </div>

            {!isModalOpen && (
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
                />
            )}
        </div>
    );
};

export default CalendarLayout;
