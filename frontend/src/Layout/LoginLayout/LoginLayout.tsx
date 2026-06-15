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
                        <p
                            className="clickable-text"
                            onClick={() => setLoggingIn(false)}
                        >
                            S'inscrire
                        </p>
                    </>
                ) : (
                    <>
                        <p>Déjà inscrit.e ?</p>
                        <p
                            className="clickable-text"
                            onClick={() => setLoggingIn(true)}
                        >
                            Se connecter
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginLayout;
