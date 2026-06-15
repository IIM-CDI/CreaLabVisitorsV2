import React from 'react';
import './LoginLayout.css';

import RegisterForm from '../../components/RegisterForm/RegisterForm';

const LoginLayout = () => {
    return (
        <div className="login-layout">
            <RegisterForm />
        </div>
    );
};

export default LoginLayout;
