import React from 'react';
import './ModalCreateEvent.css';
import { useModalManager } from '../../hooks/useModelManager';
import { useState } from 'react';
import Input from '../Input/Input';
import Button from '../Button/Button';
import Badge from '../Badge/Badge';
import { useApi } from '../../hooks/useAPI';

interface ModalCreateEventProps {
    isOpen: boolean;
    onClose: () => void;
    onEventChange?: () => void;
    userMail: string;
}

const ModalCreateEvent = ({
    isOpen,
    onClose,
    onEventChange,
    userMail,
}: ModalCreateEventProps) => {
    const { getApiUrl, getHeaders } = useApi();
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
        onEventChange,
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [eventDateStart, setEventDateStart] = useState('');
    const [eventDateEnd, setEventDateEnd] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [selectedBadge, setSelectedBadge] = useState<string>('');

    const badgesData = [
        { label: 'Impression perso', color: '#fbd2c9' },
        { label: 'Impression école', color: '#f9e2b3' },
        { label: 'Electronique', color: '#b7d5f5' },
        { label: 'Peinture', color: '#acecde' },
        { label: 'Autre', color: '#aaaaaa' },
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

        if (new Date(eventDateStart) >= new Date(eventDateEnd)) {
            setErrorMessage(
                'La date de début doit être antérieure à la date de fin.'
            );
            return;
        }

        if (new Date(eventDateStart) < new Date()) {
            setErrorMessage('La date de début doit être dans le futur.');
            return;
        }

        if (!selectedBadge) {
            setErrorMessage("Veuillez sélectionner un label pour l'événement.");
            return;
        }

        setErrorMessage('');

        const params = new URLSearchParams();
        params.append('title', eventTitle);
        params.append('description', eventDescription);
        params.append('user_mail', userMail);
        params.append('start', eventDateStart);
        params.append('end', eventDateEnd);
        params.append(
            'color',
            badgesData.find((badge) => badge.label === selectedBadge)?.color ||
                ''
        );
        params.append('badge', selectedBadge);

        fetch(`${getApiUrl()}/event/?${params.toString()}`, {
            method: 'POST',
            headers: getHeaders(),
        })
            .then((response) => response.json())
            .then((data) => {
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
            <div className="modal-content-create-event">
                <h2>Créer un événement</h2>
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
                        <Input
                            required
                            label="Date de début"
                            type="datetime-local"
                            value={eventDateStart}
                            onChange={(value: string) =>
                                setEventDateStart(value)
                            }
                        />
                        <Input
                            required
                            label="Date de fin"
                            type="datetime-local"
                            value={eventDateEnd}
                            onChange={(value: string) => setEventDateEnd(value)}
                        />
                    </div>
                    <div className="modal-badge-input-container">
                        <label htmlFor="badge">Label de l'événement</label>
                        <div className="modal-badge-container">
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
                    <p className="modal-error-text">{errorMessage}</p>
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
