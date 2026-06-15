import React, {useState} from 'react';
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
                    <p>
                        Pas encore inscrit ?{' '}
                        <p onClick={() => setLoggingIn(false)}>S'inscrire</p>
                    </p>
                ) : (
                    <p>
                        Déjà inscrit.e ?{' '}
                        <p onClick={() => setLoggingIn(true)}>Se connecter</p>
                    </p>
                )}
            </div>
        </div>
    );
};

export default LoginLayout;
