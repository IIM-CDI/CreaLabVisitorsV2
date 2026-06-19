import React, { useState } from 'react';
import './LoginForm.css';

import Input from '../Input/Input';
import Button from '../Button/Button';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (
            '@devinci.fr' !== email.split('@')[1] &&
            '@edu.devinci.fr' !== email.split('@')[1]
        ) {
            setErrorMessage(
                'Veuillez utiliser une adresse email devinci.fr ou edu.devinci.fr.'
            );
            return;
        }

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
