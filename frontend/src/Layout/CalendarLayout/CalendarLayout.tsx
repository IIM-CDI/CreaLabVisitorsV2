import React from 'react';
import Fullcalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './CalendarLayout.css';

interface CalendarLayoutProps {
    user: string;
}

const CalendarLayout = ({ user }: CalendarLayoutProps) => {

    const calendarConfig = {
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth"
        },
        buttonText: {
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
        },
        initialView: "timeGridWeek",
        firstDay: 1,
        slotLabelFormat: {
            hour: '2-digit' as const,
            minute: '2-digit' as const,
            hour12: false as const
        },
        eventTimeFormat: {
            hour: '2-digit' as const,
            minute: '2-digit' as const,
            hour12: false as const
        },
        slotMinTime: "08:00:00",
        slotMaxTime: "20:00:00",
        allDaySlot: false,
        editable: true,
        selectable: true,
        weekends: false,
    };

    return (
        <div className="calendar-layout">
            <div className="navbar">
                <h1>Bienvenue au CreaLab {user}</h1>
            </div>
            
            <div className="calendar-container">
                <Fullcalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    {...calendarConfig}
                />
            </div>
        </div>
    );
};

export default CalendarLayout;
