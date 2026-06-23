import React, { useState } from 'react';
import './LoginForm.css';

import Input from '../Input/Input';
import Button from '../Button/Button';
import { useApi } from '../../hooks/useAPI';

const LoginForm = () => {
    const { getApiUrl, getHeaders } = useApi();
    const [email, setEmail] = useState(localStorage.getItem('mail') || '');
    const [password, setPassword] = useState('');

    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);

        fetch(`${getApiUrl()}/login/?${params.toString()}`, {
            method: 'POST',
            headers: getHeaders(),
        })
            .then((response) => response.json())
            .then(() => {
                localStorage.setItem('user', JSON.stringify({ email }));
                localStorage.setItem('mail', email);
                setEmail('');
                setPassword('');
                setErrorMessage('');
                window.location.reload();
            })
            .catch((error) => {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Erreur lors de la connexion.'
                );
            });

        setErrorMessage('');
    };

    return (
        <div className="login-form">
            <h2>Connexion</h2>
            <form className="login-form-fields" onSubmit={handleSubmit}>
                <Input
                    type="email"
                    label="adresse mail"
                    value={email}
                    onChange={(e) => setEmail(e)}
                    placeholder="mail@devinci.fr"
                    required
                />
                <Input
                    type="password"
                    label="mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e)}
                    placeholder="********"
                    required
                />
                <Button type="submit" text="Se connecter" />
            </form>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
};

export default LoginForm;
