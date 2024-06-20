import React, { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import Login from './components/Login';
import Register from './components/Register';

const App = () => {
  const [token, setToken] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = (token, username) => {
    setToken(token);
    setUsername(username);
  };

  if (!token) {
    return showRegister ? (
      <Register onRegister={() => setShowRegister(false)} />
    ) : (
      <Login onLogin={handleLogin} onRegister={() => setShowRegister(true)} />
    );
  }

  return <ChatRoom token={token} username={username} />;
};

export default App;
