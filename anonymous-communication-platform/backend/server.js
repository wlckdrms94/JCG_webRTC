const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { router: authRouter, authenticate } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/auth', authRouter);

mongoose.connect('mongodb://localhost:27017/chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const messageSchema = new mongoose.Schema({
  nickname: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
  file: String
});

const Message = mongoose.model('Message', messageSchema);

let users = [];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      socket.user = decoded;
      console.log("Decoded user:", socket.user); // 디버깅 로그 추가
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log('New client connected');

  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit('loadMessages', messages);
  } catch (error) {
    console.error('Error loading messages:', error);
  }

  socket.on('join', () => {
    const nickname = socket.user.username; // 사용자 이름을 가져옵니다.
    console.log("User joined:", nickname); // 디버깅 로그 추가
    const existingUser = users.find(user => user.id === socket.id);
    if (!existingUser) {
      users.push({ id: socket.id, nickname });
      io.emit('users', users);
      io.emit('receiveMessage', { nickname: 'System', text: `${nickname} joined the chat`, timestamp: new Date() });
    }
  });

  socket.on('sendMessage', async (message) => {
    const newMessage = new Message({
      nickname: socket.user.username || "unknown", // Ensure the nickname is from the authenticated user
      text: message.text,
      timestamp: new Date(),
      file: message.file || null // 파일 경로 저장
    });
    console.log("New message:", newMessage); // 메시지가 제대로 생성되었는지 확인하기 위해 로그 추가
    await newMessage.save();
    io.emit('receiveMessage', newMessage);
  });

  socket.on('disconnect', () => {
    const user = users.find(user => user.id === socket.id);
    if (user) {
      users = users.filter(user => user.id !== socket.id);
      io.emit('users', users);
      io.emit('receiveMessage', { nickname: 'System', text: `${user.nickname} left the chat`, timestamp: new Date() });
    }
    console.log('Client disconnected');
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/upload', authenticate, upload.single('file'), (req, res) => {
  const file = req.file;
  if (file) {
    res.json({ filePath: `/uploads/${file.filename}` });
  } else {
    console.error('File upload failed:', req.error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/messages', authenticate, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
