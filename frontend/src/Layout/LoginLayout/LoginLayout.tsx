import React, { useState } from 'react';
import './LoginLayout.css';

import LoginForm from '../../components/LoginForm/LoginForm';
import RegisterForm from '../../components/RegisterForm/RegisterForm';

const LoginLayout = () => {
    const [LoggingIn, setLoggingIn] = useState(true);

    return (
        <div className="login-layout">
            {LoggingIn ? <LoginForm /> : <RegisterForm />}
            <div className="login-layout-toggle">
                {LoggingIn ? (
                    <>
                        <p>Pas encore inscrit.e ?</p>
                        <button
                            type="button"
                            className="clickable-text"
                            onClick={() => setLoggingIn(false)}
                        >
                            S'inscrire
                        </button>
                    </>
                ) : (
                    <>
                        <p>Déjà inscrit.e ?</p>
                        <button
                            type="button"
                            className="clickable-text"
                            onClick={() => setLoggingIn(true)}
                        >
                            Se connecter
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginLayout;
