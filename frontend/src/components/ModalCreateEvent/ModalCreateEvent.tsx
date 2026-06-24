import React from 'react';
import './ModalCreateEvent.css';
import { useModalManager } from '../../hooks/useModelManager';
import { useState } from 'react';
import Input from '../Input/Input';
import Button from '../Button/Button';
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
    const [color, setColor] = useState('#ff8000');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!eventTitle || !eventDateStart || !eventDateEnd || !eventDescription) {
            setErrorMessage('Veuillez remplir tous les champs.');
            return;
        }

        if (new Date(eventDateStart) >= new Date(eventDateEnd)) {
            setErrorMessage("La date de début doit être antérieure à la date de fin.");
            return;
        }

        if (new Date(eventDateStart) < new Date()) {
            setErrorMessage("La date de début doit être dans le futur.");
            return;
        }

        const params = new URLSearchParams();
        params.append('title', eventTitle);
        params.append('description', eventDescription);
        params.append('user_mail', userMail);
        params.append('start', eventDateStart);
        params.append('end', eventDateEnd);
        params.append('color', color);

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
                            onChange={(value: string) => setEventDateStart(value)}
                        />
                        <Input
                            required
                            label="Date de fin"
                            type="datetime-local"
                            value={eventDateEnd}
                            onChange={(value: string) => setEventDateEnd(value)}
                        />
                    </div>
                    <div className="modal-color-input-container">
                        <label htmlFor="color">Couleur de l'événement</label>
                        <input
                            className="modal-color-input"
                            id="color"
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </div>
                    <p className='modal-error-text'>
                        {errorMessage}
                    </p>
                    <p className="modal-info-text">
                        Les événements créés seront visibles par tous.
                        Ils devront être validés par un administrateur.
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
