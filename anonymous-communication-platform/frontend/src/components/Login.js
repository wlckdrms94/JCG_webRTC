import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const LoginInput = styled.input`
  padding: 10px;
  font-size: 16px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const LoginButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (username.trim() && password.trim()) {
      try {
        const response = await axios.post('http://localhost:4000/auth/login', {
          username,
          password
        });
        const token = response.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        onLogin(token, username);
      } catch (error) {
        console.error('Login error', error);
        alert('Login failed');
      }
    }
  };

  return (
    <LoginContainer>
      <LoginInput
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <LoginInput
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <LoginButton onClick={handleLogin}>Login</LoginButton>
    </LoginContainer>
  );
};

export default Login;
