import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import moment from 'moment';
import './ChatRoom.css';

const socket = io('http://localhost:4000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

const ChatRoom = ({ username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.emit('join', username);

    const handleReceiveMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleUsersUpdate = (users) => {
      setUsers(users);
    };

    const handleLoadMessages = (loadedMessages) => {
      setMessages(loadedMessages);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('users', handleUsersUpdate);
    socket.on('loadMessages', handleLoadMessages);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('users', handleUsersUpdate);
      socket.off('loadMessages', handleLoadMessages);
    };
  }, [username]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const messageObject = { text: message, timestamp: new Date() };
      socket.emit('sendMessage', messageObject);
      setMessage('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:4000/upload', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const filePath = response.data.filePath;
      const messageObject = { text: filePath, timestamp: new Date(), file: filePath };
      socket.emit('sendMessage', messageObject);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  return (
    <div className="ChatRoomContainer">
      <div className="UserList">
        {users.map(user => (
          <div key={user.id}>{user.nickname}</div>
        ))}
      </div>
      <div className="MessageList">
        {messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((msg, index) => (
          <div key={index}>
            <strong>{moment(msg.timestamp).format('YY-MM-DD HH:mm')} ({msg.nickname}):</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="MessageInputContainer">
        <input
          type="text"
          className="MessageInput"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="SendMessageButton" onClick={handleSendMessage}>Send</button>
        <input type="file" onChange={handleFileUpload} />
      </div>
    </div>
  );
};

export default ChatRoom;
