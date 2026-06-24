import React, { useState, useEffect } from 'react';
import Fullcalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './CalendarLayout.css';

import ModalValidateEvent from '../../components/ModalValidateEvent/ModalValidateEvent';
import ModalCreateEvent from '../../components/ModalCreateEvent/ModalCreateEvent';
import Button from '../../components/Button/Button';
import { useApi } from '../../hooks/useAPI';

interface CalendarLayoutProps {
    user: { email: string };
}

const CalendarLayout = ({ user }: CalendarLayoutProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const { getApiUrl, getHeaders } = useApi();
    const [isAdmin, setIsAdmin] = useState(false);

    async function checkAdminStatus() {
        const response = await fetch(`${getApiUrl()}/user/${user.email}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();
        console.log('Admin status:', data);
        setIsAdmin(data.user.admin);
    }

    useEffect(() => {
        checkAdminStatus();
    }, [user.email]);

    const emailToName = (email: string) => {
        const namePart = email.split('@')[0];
        const nameWithSpaces = namePart.replace('.', ' ');
        return nameWithSpaces
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };


    const calendarConfig = {
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
        },
        buttonText: {
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
        },
        initialView: 'timeGridWeek',
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
        editable: true,
        selectable: true,
        weekends: false,
        locale: frLocale,
    };


    const darkOrLight = (red: number, green: number, blue: number) => {
    let brightness = (red * 299) + (green * 587) + (blue * 114);
    brightness /= 255000;
    return brightness >= 0.5 ? "dark-text" : "light-text";
    }


    async function fetchEvents() {
        const response = await fetch(`${getApiUrl()}/events/`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();

        const events = data.events.map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            accepted: event.accepted,
            backgroundColor: event.accepted ? event.color : '#676767',
            textColor: darkOrLight( parseInt(event.color.slice(1, 3), 16),
                                    parseInt(event.color.slice(3, 5), 16),
                                    parseInt(event.color.slice(5, 7), 16)
            ),
        }));

        setEvents(events);
        return events;
    }

    useEffect(() => {
        fetchEvents();
    }, [isModalOpen]);

    const handleDeconnect = () => {
        localStorage.setItem('user', JSON.stringify(null));
        window.location.reload();
    };

    async function autoDeconnect() {
        localStorage.removeItem('user');
        window.location.reload();
    }

    useEffect(() => {
        const interval = setInterval(autoDeconnect, 300_000);
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
                        eventIds={events
                            .filter((event) => !event.accepted)
                            .map((event) => event.id)}
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
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    {...calendarConfig}
                    events={events}
                    eventContent={(arg) => (
                        <div className="fc-event-content">
                            <div className="fc-event-title">{arg.event.title}</div>
                            <div className="fc-event-time">{arg.timeText}</div>
                            <div className="fc-event-description">{arg.event.extendedProps.description}</div>
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
                />
            )}
        </div>
    );
};

export default CalendarLayout;
