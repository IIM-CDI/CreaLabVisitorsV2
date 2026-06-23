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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

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

        try {
            const params = new URLSearchParams();
            params.append('email', email);
            params.append('password', password);

            const response = await fetch(
                `${getApiUrl()}/user/?${params.toString()}`,
                {
                    method: 'POST',
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data.message || "Erreur lors de l'inscription."
                );
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
                    placeholder="thomas@devinci.fr"
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
                    text="S'inscrire"
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
