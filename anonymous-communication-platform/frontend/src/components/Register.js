import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const RegisterTitle = styled.h2`
    font-size:13px;
    font-color:#000;
`;

const RegisterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const RegisterInput = styled.input`
  padding: 10px;
  font-size: 16px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const RegisterButton = styled.button`
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

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (username.trim() && password.trim()) {
      try {
        await axios.post('http://localhost:4000/auth/register', {
          username,
          password
        });
        alert('User registered successfully');
        onRegister();
      } catch (error) {
        console.error('Registration error', error);
        alert('Registration failed');
      }
    }
  };

  return (
    <RegisterContainer>
        <RegisterTitle>Register</RegisterTitle>
        <RegisterInput
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        />
        <RegisterInput
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        />
        <RegisterButton onClick={handleRegister}>Register</RegisterButton>
    </RegisterContainer>
  );
};

export default Register;
