import React from 'react';
import './ModalCreateEvent.css';
import { useModalManager } from '../../hooks/useModelManager';
import { useState } from 'react';
import Input from '../Input/Input';
import Button from '../Button/Button';
import Badge from '../Badge/Badge';
import { useApi } from '../../hooks/useAPI';

const splitDateTimeValue = (dateTimeValue: string) => {
    const [date = '', time = ''] = dateTimeValue.split('T');
    return { date, time };
};

const buildDateTimeValue = (date: string, time: string) => {
    if (!date || !time) return '';
    return `${date}T${time}`;
};

interface ModalCreateEventProps {
    isOpen: boolean;
    onClose: () => void;
    onEventChange?: () => void;
    userMail: string;
    clickedTime?: string | null;
}

const ModalCreateEvent = ({
    isOpen,
    onClose,
    onEventChange,
    userMail,
    clickedTime,
}: ModalCreateEventProps) => {
    const { getApiUrl, getHeaders } = useApi();
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
        onEventChange,
    });
    const clickedTimeValue = clickedTime ? clickedTime.slice(0, 16) : '';
    const clickedTimeParts = splitDateTimeValue(clickedTimeValue);

    const [errorMessage, setErrorMessage] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [eventStartDate, setEventStartDate] = useState(clickedTimeParts.date);
    const [eventStartTime, setEventStartTime] = useState(clickedTimeParts.time);
    const [eventEndDate, setEventEndDate] = useState('');
    const [eventEndTime, setEventEndTime] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [selectedBadge, setSelectedBadge] = useState<string>('');

    const eventDateStart = buildDateTimeValue(eventStartDate, eventStartTime);
    const eventDateEnd = buildDateTimeValue(eventEndDate, eventEndTime);

    const badgesData = [
        { label: 'Impression perso', color: '#fbd2c9' },
        { label: 'Impression école', color: '#f9e2b3' },
        { label: 'Electronique', color: '#b7d5f5' },
        { label: 'Peinture', color: '#acecde' },
        { label: 'Autre', color: '#e7d3fa' },
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (
            !eventTitle ||
            !eventDateStart ||
            !eventDateEnd ||
            !eventDescription
        ) {
            setErrorMessage('Veuillez remplir tous les champs.');
            return;
        }

        const startTime = new Date(eventDateStart).getTime();
        const endTime = new Date(eventDateEnd).getTime();

        if (startTime >= endTime) {
            setErrorMessage(
                'La date de début doit être antérieure à la date de fin.'
            );
            return;
        }

        if (endTime - startTime < 30 * 60 * 1000) {
            setErrorMessage(
                "La durée de l'événement doit être d'au moins 30 minutes."
            );
            return;
        }

        if (startTime < Date.now()) {
            setErrorMessage('La date de début doit être dans le futur.');
            return;
        }

        if (!selectedBadge) {
            setErrorMessage("Veuillez sélectionner un label pour l'événement.");
            return;
        }

        setErrorMessage('');
        fetch(`${getApiUrl()}/event/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                title: eventTitle,
                description: eventDescription,
                user_mail: userMail,
                start: eventDateStart,
                end: eventDateEnd,
                color:
                    badgesData.find((badge) => badge.label === selectedBadge)
                        ?.color || '',
                badge: selectedBadge,
            }),
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                            data.message ||
                            "Erreur lors de la création de l'événement."
                    );
                }
                if (onEventChange) {
                    onEventChange();
                }
                handleClose();
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-backdrop-create-event"
            onClick={handleBackdropClick}
        >
            <div
                className="modal-content-create-event"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-event-title"
            >
                <h2 id="create-event-title">Créer un événement</h2>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <Input
                        required
                        label="Titre"
                        value={eventTitle}
                        onChange={(value: string) => setEventTitle(value)}
                    />
                    <Input
                        required
                        label="Description"
                        value={eventDescription}
                        onChange={(value: string) => setEventDescription(value)}
                    />
                    <div className="modal-datetime-inputs">
                        <div className="modal-datetime-group">
                            <Input
                                required
                                label="Date de début"
                                type="date"
                                value={eventStartDate}
                                onChange={(value: string) =>
                                    setEventStartDate(value)
                                }
                            />
                            <Input
                                required
                                label="Heure de début"
                                type="time"
                                value={eventStartTime}
                                onChange={(value: string) =>
                                    setEventStartTime(value)
                                }
                            />
                        </div>
                        <div className="modal-datetime-group">
                            <Input
                                required
                                label="Date de fin"
                                type="date"
                                value={eventEndDate}
                                onChange={(value: string) =>
                                    setEventEndDate(value)
                                }
                            />
                            <Input
                                required
                                label="Heure de fin"
                                type="time"
                                value={eventEndTime}
                                onChange={(value: string) =>
                                    setEventEndTime(value)
                                }
                            />
                        </div>
                    </div>
                    <div className="modal-badge-input-container">
                        <span id="event-badge-label">
                            Label de l'événement
                        </span>
                        <div
                            className="modal-badge-container"
                            role="group"
                            aria-labelledby="event-badge-label"
                        >
                            {badgesData.map((badge) => (
                                <Badge
                                    key={badge.label}
                                    label={badge.label}
                                    color={badge.color}
                                    selected={selectedBadge === badge.label}
                                    onClick={() =>
                                        setSelectedBadge(badge.label)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                    {errorMessage && (
                        <p className="modal-error-text" role="alert">
                            {errorMessage}
                        </p>
                    )}
                    <p className="modal-info-text">
                        Les événements créés seront visibles par tous. Ils
                        devront être validés par un administrateur.
                    </p>
                    <div className="modal-buttons">
                        <Button
                            type="submit"
                            component_type="primary"
                            text="Créer"
                        />
                        <Button
                            type="button"
                            component_type="danger"
                            onClick={handleClose}
                            text="Annuler"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCreateEvent;
