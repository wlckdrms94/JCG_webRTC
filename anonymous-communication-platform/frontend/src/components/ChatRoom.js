import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import axios from 'axios';
import moment from 'moment';

const ChatRoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
`;

const MessageList = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse;
`;

const MessageInputContainer = styled.div`
  display: flex;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ccc;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SendMessageButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  margin-left: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const UploadButton = styled.label`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  margin-left: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const ChatRoom = ({ token, username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:4000', {
      auth: { token }
    });

    socketRef.current.on('loadMessages', (loadedMessages) => {
      setMessages(loadedMessages);
    });

    socketRef.current.on('receiveMessage', (newMessage) => {
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
    });

    socketRef.current.on('users', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socketRef.current.emit('join', username);

    return () => {
      socketRef.current.disconnect();
    };
  }, [token, username]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        nickname: username, // Ensure the nickname is sent with the message
        text: message,
        timestamp: new Date()
      };
      socketRef.current.emit('sendMessage', newMessage);
      setMessage('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:4000/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const newMessage = {
        nickname: username, // Ensure the nickname is sent with the message
        text: response.data.filePath,
        timestamp: new Date(),
        file: response.data.filePath
      };
      socketRef.current.emit('sendMessage', newMessage);
    } catch (error) {
      console.error('File upload failed', error);
    }
  };

  return (
    <ChatRoomContainer>
      <div>
        {users.map((user) => (
          <div key={user.id}>{user.nickname}</div>
        ))}
      </div>
      <MessageList>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{moment(msg.timestamp).format('YY-MM-DD HH:mm')}</strong> ({msg.nickname}): {msg.text}
          </div>
        ))}
      </MessageList>
      <MessageInputContainer>
        <MessageInput
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <SendMessageButton onClick={handleSendMessage}>Send</SendMessageButton>
        <UploadButton>
          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
          Upload
        </UploadButton>
      </MessageInputContainer>
    </ChatRoomContainer>
  );
};

export default ChatRoom;
