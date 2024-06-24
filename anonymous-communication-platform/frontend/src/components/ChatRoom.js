import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import moment from 'moment';
import './ChatRoom.css';

const ChatRoom = ({ token, username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [profileImage, setProfileImage] = useState('');
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:4000', {
      auth: { token }
    });

    socketRef.current.on('loadMessages', (loadedMessages) => {
      setMessages(loadedMessages.reverse());
    });

    socketRef.current.on('receiveMessage', (newMessage) => {
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
    });

    socketRef.current.on('users', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socketRef.current.emit('join', username);

    const fetchProfileImage = async () => {
      try {
        const response = await axios.get('http://localhost:4000/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProfileImage(response.data.profileImage);
      } catch (error) {
        console.error('Failed to fetch profile image', error);
      }
    };

    fetchProfileImage();

    return () => {
      socketRef.current.disconnect();
    };
  }, [token, username]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        nickname: username,
        text: message,
        timestamp: new Date()
      };
      socketRef.current.emit('sendMessage', newMessage);
      setMessage('');
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await axios.post('http://localhost:4000/upload-profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProfileImage(response.data.filePath);
    } catch (error) {
      console.error('Profile image upload failed', error);
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
        nickname: username,
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
    <div className="chat-room-container">
      <div className="profile-container">
        <img src={profileImage} alt="Profile" className="profile-image" />
        <input type="file" onChange={handleProfileImageUpload} className="profile-upload-input" />
      </div>
      <div className="user-list">
        {users.map((user) => (
          <div key={user.id}>{user.nickname}</div>
        ))}
      </div>
      <div className="message-list">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{moment(msg.timestamp).format('YY-MM-DD HH:mm')}</strong> ({msg.nickname}): {msg.text}
            {msg.file && (
              <div>
                <a href={msg.file} download>Download File</a>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="message-input-container">
        <input
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="message-input"
        />
        <button onClick={handleSendMessage} className="send-message-button">Send</button>
        <label className="upload-button">
          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
          Upload
        </label>
      </div>
    </div>
  );
};

export default ChatRoom;
