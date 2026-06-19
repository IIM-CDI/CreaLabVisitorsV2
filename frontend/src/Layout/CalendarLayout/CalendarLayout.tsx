import React, { useState } from 'react';
import Fullcalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import './CalendarLayout.css';

import ModalCreateEvent from '../../components/ModalCreateEvent/ModalCreateEvent';
import Button from '../../components/Button/Button';

interface CalendarLayoutProps {
    user: { email: string; name: string };
}

const CalendarLayout = ({ user }: CalendarLayoutProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleDeconnect = () => {
        localStorage.setItem('user', JSON.stringify(null));
        window.location.reload();
    };

    return (
        <div className="calendar-layout">
            <div className="navbar">
                <div></div>
                <h1>Bienvenue au CreaLab {user.name}</h1>
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
