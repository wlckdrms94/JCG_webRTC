import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import axios from 'axios';

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

const FileInput = styled.input`
  display: none;
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
  background-color: #28a745;
  color: white;
  cursor: pointer;
  margin-left: 10px;

  &:hover {
    background-color: #218838;
  }
`;

const UserList = styled.div`
  padding: 10px;
  background-color: #e9ecef;
  border-bottom: 1px solid #ccc;
`;

const ChatRoom = ({ token, username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io('http://localhost:4000', {
      auth: { token },
    });
  
    socket.current.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      if (document.hidden) {
        new Notification(`${message.nickname}: ${message.text}`);
      }
    });
  
    socket.current.on('users', (users) => {
      setUsers(users);
    });
  
    const fetchMessages = async (page) => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:4000/messages', {
          params: { page },
          headers: { Authorization: `Bearer ${token}` }, // JWT 토큰을 헤더에 포함
        });
        setMessages((prevMessages) => [...response.data.reverse(), ...prevMessages]);
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMessages(page);
  
    return () => {
      socket.current.disconnect();
    };
  }, [token, page]);
  

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadMoreMessages = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleSendMessage = () => {
    if (message.trim() || file) {
      const messageObject = { nickname: username, text: message };
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
  
        axios.post('http://localhost:4000/upload', formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(response => {
            messageObject.file = response.data.filePath;
            socket.current.emit('sendMessage', messageObject);
            setFile(null);
          })
          .catch(error => {
            console.error('File upload error:', error);
          });
      } else {
        socket.current.emit('sendMessage', messageObject);
      }
      setMessage('');
    }
  };
  

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <ChatRoomContainer>
      <UserList>
        {users.map(user => (
          <div key={user.id}>{user.nickname}</div>
        ))}
      </UserList>
      <MessageList>
        {loading && <div>Loading...</div>}
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.nickname}:</strong> {msg.text}
            {msg.file && <div><a href={`http://localhost:4000${msg.file}`} target="_blank" rel="noopener noreferrer">Download File</a></div>}
          </div>
        ))}
      </MessageList>
      <button onClick={loadMoreMessages}>Load more</button>
      <MessageInputContainer>
        <MessageInput
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <FileInput
          type="file"
          id="fileInput"
          onChange={handleFileChange}
        />
        <UploadButton htmlFor="fileInput">Upload File</UploadButton>
        <SendMessageButton onClick={handleSendMessage}>Send</SendMessageButton>
      </MessageInputContainer>
    </ChatRoomContainer>
  );
};

export default ChatRoom;
