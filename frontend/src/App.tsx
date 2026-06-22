import React, { useState } from 'react';
import './App.css';

import LoginLayout from './Layout/LoginLayout/LoginLayout';
import CalendarLayout from './Layout/CalendarLayout/CalendarLayout';

function App() {
    const user = 
        localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')!)
            : null
        ;

    return (
        <div className="App">
            <div className="background" />
            {user ? <CalendarLayout user={user} /> : <LoginLayout />}
        </div>
    );
}

export default App;
