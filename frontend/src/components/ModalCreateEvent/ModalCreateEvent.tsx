import React, { useEffect, useRef, useState } from 'react';
import './ModalCreateEvent.css';
import { useModalManager } from '../../hooks/useModelManager';
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

const TIME_STEP_SECONDS = 15 * 60;
const SECONDS_PER_DAY = 86400;

const padTimePart = (value: number) => String(value).padStart(2, '0');

const roundToQuarterHour = (timeValue: string) => {
    if (!timeValue) return '';

    const [hoursValue, minutesValue = '0', secondsValue = '0'] =
        timeValue.split(':');
    const hours = Number(hoursValue);
    const minutes = Number(minutesValue);
    const seconds = Number(secondsValue);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        !Number.isInteger(seconds) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59
    ) {
        return '';
    }

    const totalSeconds = hours * 60 * 60 + minutes * 60 + seconds;
    const roundedSeconds =
        Math.round(totalSeconds / TIME_STEP_SECONDS) * TIME_STEP_SECONDS;
    const normalizedSeconds = roundedSeconds % SECONDS_PER_DAY;
    const normalizedHours = Math.floor(normalizedSeconds / (60 * 60));
    const normalizedMinutes = Math.floor((normalizedSeconds % (60 * 60)) / 60);

    return `${padTimePart(normalizedHours)}:${padTimePart(normalizedMinutes)}`;
};

interface ModalCreateEventProps {
    isOpen: boolean;
    onClose: () => void;
    onEventChange?: () => void;
    userMail: string;
    initialSelection?: {
        start: string;
        end?: string;
    } | null;
}

const ModalCreateEvent = ({
    isOpen,
    onClose,
    onEventChange,
    userMail,
    initialSelection,
}: ModalCreateEventProps) => {
    const { getApiUrl, getHeaders } = useApi();
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
        onEventChange,
    });
    const initialStartValue = initialSelection?.start
        ? initialSelection.start.slice(0, 16)
        : '';
    const initialEndValue = initialSelection?.end
        ? initialSelection.end.slice(0, 16)
        : '';
    const initialStartParts = splitDateTimeValue(initialStartValue);
    const initialEndParts = splitDateTimeValue(initialEndValue);

    const [errorMessage, setErrorMessage] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [eventStartDate, setEventStartDate] = useState(
        initialStartParts.date
    );
    const [eventStartTime, setEventStartTime] = useState(
        initialStartParts.time
    );
    const [eventEndDate, setEventEndDate] = useState(initialEndParts.date);
    const [eventEndTime, setEventEndTime] = useState(initialEndParts.time);
    const [eventDescription, setEventDescription] = useState('');
    const [selectedBadge, setSelectedBadge] = useState<string>('');
    const [customBadgeLabel, setCustomBadgeLabel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const submittedBadgeLabel =
        selectedBadge === 'Autre'
            ? customBadgeLabel.trim() || 'Autre'
            : selectedBadge;

    const badgesData = [
        { label: 'Impression perso', color: '#fbd2c9' },
        { label: 'Impression école', color: '#f9e2b3' },
        { label: 'Electronique', color: '#b7d5f5' },
        { label: 'Peinture', color: '#acecde' },
        { label: 'Autre', color: '#e7d3fa' },
    ];

    useEffect(() => {
        if (isOpen) {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleStartTimeBlur = () => {
        setEventStartTime(roundToQuarterHour(eventStartTime));
    };

    const handleEndTimeBlur = () => {
        setEventEndTime(roundToQuarterHour(eventEndTime));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSubmittingRef.current) {
            return;
        }

        const normalizedStartTime = roundToQuarterHour(eventStartTime);
        const normalizedEndTime = roundToQuarterHour(eventEndTime);
        const normalizedEventDateStart = buildDateTimeValue(
            eventStartDate,
            normalizedStartTime
        );
        const normalizedEventDateEnd = buildDateTimeValue(
            eventEndDate,
            normalizedEndTime
        );

        setEventStartTime(normalizedStartTime);
        setEventEndTime(normalizedEndTime);

        if (
            !eventTitle ||
            !normalizedEventDateStart ||
            !normalizedEventDateEnd
        ) {
            setErrorMessage('Veuillez remplir les champs obligatoires.');
            return;
        }

        const startTime = new Date(normalizedEventDateStart).getTime();
        const endTime = new Date(normalizedEventDateEnd).getTime();

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
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            const response = await fetch(`${getApiUrl()}/event/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    title: eventTitle,
                    description: eventDescription.trim(),
                    user_mail: userMail,
                    start: normalizedEventDateStart,
                    end: normalizedEventDateEnd,
                    color:
                        badgesData.find(
                            (badge) => badge.label === selectedBadge
                        )?.color || '',
                    badge: submittedBadgeLabel,
                }),
            });
            const data = await response.json().catch(() => ({}));
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
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la création de l'événement."
            );
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
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
                                step={TIME_STEP_SECONDS}
                                value={eventStartTime}
                                onChange={(value: string) =>
                                    setEventStartTime(value)
                                }
                                onTimeBlur={handleStartTimeBlur}
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
                                step={TIME_STEP_SECONDS}
                                value={eventEndTime}
                                onChange={(value: string) =>
                                    setEventEndTime(value)
                                }
                                onTimeBlur={handleEndTimeBlur}
                            />
                        </div>
                        <p className="modal-info-text">
                            L'heure de début et de fin sera arrondie à un quart
                            d'heure près.
                        </p>
                    </div>
                    <div className="modal-badge-input-container">
                        <span id="event-badge-label">Label de l'événement</span>
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
                                    customLabel={
                                        badge.label === 'Autre'
                                            ? customBadgeLabel
                                            : undefined
                                    }
                                    onCustomLabelChange={(value: string) => {
                                        setCustomBadgeLabel(value);
                                        setSelectedBadge('Autre');
                                    }}
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
                            type="button"
                            component_type="danger"
                            onClick={handleClose}
                            text="Annuler"
                        />
                        <Button
                            type="submit"
                            component_type="primary"
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                            text={isSubmitting ? 'Création...' : 'Créer'}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCreateEvent;
