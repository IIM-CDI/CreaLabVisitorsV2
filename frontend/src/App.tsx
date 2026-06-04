import React from 'react';
import './App.css';

import LoginLayout from './Layout/LoginLayout/LoginLayout';
import CalendarLayout from './Layout/CalendarLayout/CalendarLayout';

function App() {
    return (
        <div className="App">
            <div className="background" />
            <LoginLayout />
            <CalendarLayout />
        </div>
    );
}

export default App;
