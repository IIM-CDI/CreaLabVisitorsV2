import React, { useState } from 'react';
import './RegisterForm.css';
import Input from '../Input/Input';
import Button from '../Button/Button';
import { useApi } from '../../hooks/useAPI';

const RegisterForm = () => {
    const { getApiUrl, getHeaders } = useApi();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSubmitting) return;

        if (
            'devinci.fr' !== email.split('@')[1] &&
            'edu.devinci.fr' !== email.split('@')[1]
        ) {
            setErrorMessage(
                'Veuillez utiliser une adresse email devinci.fr ou edu.devinci.fr.'
            );
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        setErrorMessage('');
        setIsSubmitting(true);

        try {
            const response = await fetch(`${getApiUrl()}/user/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data.detail ||
                        data.message ||
                        "Erreur lors de l'inscription."
                );
                setIsSubmitting(false);
                return;
            }

            alert(
                'Inscription réussie ! Vous pouvez maintenant vous connecter.'
            );
            localStorage.setItem('mail', email);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setErrorMessage('');
            window.location.reload();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de l'inscription."
            );
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-form">
            <h2>Inscription</h2>
            <form className="register-form-fields" onSubmit={handleSubmit}>
                <Input
                    type="email"
                    label="adresse mail"
                    value={email}
                    placeholder="prenom.nom@edu.devinci.fr"
                    onChange={(e) => setEmail(e)}
                    required
                />
                <Input
                    type="password"
                    label="mot de passe"
                    value={password}
                    placeholder="********"
                    onChange={(e) => setPassword(e)}
                    required
                />
                <Input
                    type="password"
                    label="confirmer mot de passe"
                    value={confirmPassword}
                    placeholder="********"
                    onChange={(e) => setConfirmPassword(e)}
                    required
                />
                <Button
                    type="submit"
                    component_type="primary"
                    text={isSubmitting ? 'Inscription...' : "S'inscrire"}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    isLoading={isSubmitting}
                />
            </form>

            {errorMessage && (
                <div className="error-message">
                    <p>{errorMessage}</p>
                </div>
            )}
        </div>
    );
};

export default RegisterForm;
