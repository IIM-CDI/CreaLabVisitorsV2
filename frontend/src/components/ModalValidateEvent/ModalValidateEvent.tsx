import React from 'react';
import './ModalValidateEvent.css'
import { useModalManager } from '../../hooks/useModelManager';
import Button from '../Button/Button';
import {useApi} from '../../hooks/useAPI';

interface ModalValidateEventProps {
    isOpen: boolean;
    onClose: () => void;
    onEventChange?: () => void;
    eventIds: string[];
}

const ModalValidateEvent = ({
    isOpen,
    onClose,
    onEventChange,
    eventIds,
}: ModalValidateEventProps) => {
    const { getApiUrl, getHeaders } = useApi();
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
        onEventChange,
    });

    const handleAcceptEvent = (eventId: string) => {
        fetch(`${getApiUrl()}/event/validate/${eventId}`, {
            method: 'PUT',
            headers: getHeaders(),
        })
            .then((response) => response.json())
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    const handleRejectEvent = (eventId: string) => {
        fetch(`${getApiUrl()}/event/reject/${eventId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        })
            .then((response) => response.json())
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    return (
        <div className={`modal-backdrop-validate-event ${isOpen ? 'open' : ''}`} onClick={handleBackdropClick}>
            <div className="modal-content-validate-event">
                <h2>Valider les événements</h2>
                {eventIds.map((eventId,index) => (
                    <div key={index} className="event-item">
                        <p>Événement ID: {eventId}</p>
                        <Button
                            component_type="accept"
                            text="Accepter"
                            onClick={() => handleAcceptEvent(eventId)}
                        />
                        <Button
                            component_type="danger"
                            text="Rejeter"
                            onClick={() => handleRejectEvent(eventId)}
                        />
                    </div>
                ))}
                <Button component_type="secondary" text="Fermer" onClick={handleClose} />
            </div>
        </div>
    );
};

export default ModalValidateEvent;