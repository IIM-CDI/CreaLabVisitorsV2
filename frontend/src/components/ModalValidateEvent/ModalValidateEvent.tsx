import React, { useState } from 'react';
import './ModalValidateEvent.css';
import { useModalManager } from '../../hooks/useModelManager';
import Button from '../Button/Button';
import { useApi } from '../../hooks/useAPI';

interface ModalValidateEventProps {
    isOpen: boolean;
    onClose: () => void;
    onEventChange?: () => void;
    eventInfo: [string, string][];
}

type LoadingAction = {
    eventId: string;
    action: 'accept' | 'reject';
};

const ModalValidateEvent = ({
    isOpen,
    onClose,
    onEventChange,
    eventInfo,
}: ModalValidateEventProps) => {
    const { getApiUrl, getHeaders } = useApi();
    const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(
        null
    );
    const { handleClose, handleBackdropClick } = useModalManager({
        isOpen,
        onClose,
        onEventChange,
    });

    const handleAcceptEvent = async (eventId: string) => {
        if (loadingAction) return;

        setLoadingAction({ eventId, action: 'accept' });

        try {
            const response = await fetch(
                `${getApiUrl()}/event/validate/${eventId}`,
                {
                    method: 'PUT',
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Request failed with status ${response.status}`
                );
            }

            if (onEventChange) {
                onEventChange();
            }
            window.location.reload();
        } catch (error) {
            console.error('Error:', error);
            setLoadingAction(null);
        }
    };

    const handleRejectEvent = async (eventId: string) => {
        if (loadingAction) return;

        setLoadingAction({ eventId, action: 'reject' });

        try {
            const response = await fetch(
                `${getApiUrl()}/event/reject/${eventId}`,
                {
                    method: 'DELETE',
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Request failed with status ${response.status}`
                );
            }

            if (onEventChange) {
                onEventChange();
            }
            window.location.reload();
        } catch (error) {
            console.error('Error:', error);
            setLoadingAction(null);
        }
    };

    return (
        <div
            className={`modal-backdrop-validate-event ${isOpen ? 'open' : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                className="modal-content-validate-event"
                role="dialog"
                aria-modal="true"
                aria-labelledby="validate-events-title"
            >
                <button
                    className="validate-events-close"
                    type="button"
                    onClick={handleClose}
                    aria-label="Fermer la validation des événements"
                >
                    ×
                </button>
                <h2 id="validate-events-title">Valider les événements</h2>
                {eventInfo.map(([eventId, eventTitle], index) => {
                    const isAccepting =
                        loadingAction?.eventId === eventId &&
                        loadingAction.action === 'accept';
                    const isRejecting =
                        loadingAction?.eventId === eventId &&
                        loadingAction.action === 'reject';
                    const isActionDisabled = Boolean(loadingAction);

                    return (
                        <div key={index} className="event-item">
                            <p className="event-id">
                                Événement : {eventTitle} - ID : {eventId}
                            </p>
                            <div className="event-buttons">
                                <Button
                                    component_type="accept"
                                    text={
                                        isAccepting
                                            ? 'Validation...'
                                            : 'Accepter'
                                    }
                                    onClick={() => handleAcceptEvent(eventId)}
                                    disabled={isActionDisabled}
                                    aria-busy={isAccepting}
                                    isLoading={isAccepting}
                                />
                                <Button
                                    component_type="danger"
                                    text={isRejecting ? 'Rejet...' : 'Rejeter'}
                                    onClick={() => handleRejectEvent(eventId)}
                                    disabled={isActionDisabled}
                                    aria-busy={isRejecting}
                                    isLoading={isRejecting}
                                />
                            </div>
                        </div>
                    );
                })}
                <Button
                    component_type="secondary"
                    text="Fermer"
                    onClick={handleClose}
                />
            </div>
        </div>
    );
};

export default ModalValidateEvent;
