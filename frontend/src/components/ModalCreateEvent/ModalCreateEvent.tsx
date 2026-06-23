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

    const [eventTitle, setEventTitle] = useState('');
    const [eventDateStart, setEventDateStart] = useState('');
    const [eventDateEnd, setEventDateEnd] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [color, setColor] = useState('#ffffff');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

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
                <form onSubmit={handleSubmit}>
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
                    <Input
                        required
                        label="Couleur"
                        type="color"
                        value={color}
                        onChange={(value: string) => setColor(value)}
                    />
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
