import React, { useState } from 'react';
import './RegisterForm.css';
import TextInput from '../TextInput/TextInput';
import Button from '../Button/Button';

const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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

        if (password !== confirmPassword) {
            setErrorMessage('Les mots de passe ne correspondent pas.');
            return;
        }
        setErrorMessage('');
    };

    return (
        <div className="register-form">
            <h2>Inscription</h2>
            <form className="register-form-fields" onSubmit={handleSubmit}>
                <TextInput
                    type="email"
                    label="adresse mail"
                    value={email}
                    placeholder="thomas@devinci.fr"
                    onChange={(e) => setEmail(e)}
                    required
                />
                <TextInput
                    type="password"
                    label="mot de passe"
                    value={password}
                    placeholder="********"
                    onChange={(e) => setPassword(e)}
                    required
                />
                <TextInput
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
