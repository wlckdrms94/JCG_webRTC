import React, { useState } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import Register from './components/Register';

const App = () => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = (token, username) => {
    setToken(token);
    setUsername(username);
  };

  const handleRegister = () => {
    setIsRegistering(false);
  };

  return (
    <div>
      {token ? (
        <ChatRoom token={token} username={username} />
      ) : isRegistering ? (
        <Register onRegister={handleRegister} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      {!token && (
        <div>
          <button onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Back to Login' : 'Go to Register'}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
