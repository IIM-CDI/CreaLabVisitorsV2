import React from 'react';
import './ModalCreateEvent.css';
import { useModalManager } from '../../hooks/useModelManager';
import { useState } from 'react';
import Input from '../Input/Input';
import Button from '../Button/Button';

interface ModalCreateEventProps {
    isOpen: boolean;
    onClose: () => void;
    onEventChange?: () => void;
    userMail: string;
}

const ModalCreateEvent = ({ isOpen, onClose, onEventChange, userMail }: ModalCreateEventProps) => {

    const { handleClose, handleBackdropClick } = useModalManager({ isOpen, onClose, onEventChange });

    const [eventTitle, setEventTitle] = useState('');
    const [eventDateStart, setEventDateStart] = useState('');
    const [eventDateEnd, setEventDateEnd] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [color, setColor] = useState('#ffffff');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log('Event Created:', {
            title: eventTitle,
            start: eventDateStart,
            end: eventDateEnd,
            description: eventDescription,
            color: color,
            userMail: userMail
        });

        const eventData = {
            title: eventTitle,
            start: eventDateStart,
            end: eventDateEnd,
            description: eventDescription,
            color: color,
            userMail: userMail,
            accepted: false
        };

        //add backend later

        handleClose();

        return eventData;

    }

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <h2>Créer un événement</h2>
                <form onSubmit={handleSubmit}>
                    <Input required label="Titre" value={eventTitle} onChange={(value: string) => setEventTitle(value)} />
                    <Input required label="Date de début" type="datetime-local" value={eventDateStart} onChange={(value: string) => setEventDateStart(value)} />
                    <Input required label="Date de fin" type="datetime-local" value={eventDateEnd} onChange={(value: string) => setEventDateEnd(value)} />
                    <Input required label="Description" value={eventDescription} onChange={(value: string) => setEventDescription(value)} />
                    <Input required label="Couleur" type="color" value={color} onChange={(value: string) => setColor(value)} />
                    <div className="modal-buttons">
                        <Button type="submit" text="Créer"  />
                        <Button type="button" onClick={handleClose} text="Annuler" />
                    </div>
                </form>
            </div>
        </div>
    );

}

export default ModalCreateEvent;