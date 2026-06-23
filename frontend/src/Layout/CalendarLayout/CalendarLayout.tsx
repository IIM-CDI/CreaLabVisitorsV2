import React, { useState, useEffect } from 'react';
import Fullcalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './CalendarLayout.css';

import ModalCreateEvent from '../../components/ModalCreateEvent/ModalCreateEvent';
import Button from '../../components/Button/Button';
import { useApi } from '../../hooks/useAPI';

interface CalendarLayoutProps {
    user: { email: string };
}

const CalendarLayout = ({ user }: CalendarLayoutProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const { getApiUrl, getHeaders } = useApi();

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



    async function fetchEvents() {
        const response = await fetch(`${getApiUrl()}/events/`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();

        const events = data.events.map((event: any) => ({
            title: event.title,
            start: event.start,
            end: event.end,
            color: event.accepted ? event.color : '#676767',
        }));

        setEvents(events);
        return events;
    }

    useEffect(() => {fetchEvents()}, [isModalOpen]);


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
                <div></div>
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
                    events= {events}
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
