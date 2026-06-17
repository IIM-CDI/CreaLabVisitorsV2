import React, {useState} from 'react';
import './App.css';

import LoginLayout from './Layout/LoginLayout/LoginLayout';
import CalendarLayout from './Layout/CalendarLayout/CalendarLayout';

function App() {
    localStorage.setItem('user', 'John Doe'); // Set a default user for demonstration purposes
    const [user, setUser] = useState(localStorage.getItem('user') || null);

    return (
        <div className="App">
            <div className="background" />
            {user ? <CalendarLayout user={user} /> : <LoginLayout />}
        </div>
    );
}

export default App;
