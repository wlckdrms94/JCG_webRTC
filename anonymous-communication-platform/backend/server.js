const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { router: authRouter, authenticate } = require('./auth'); // auth.js 파일 불러오기

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json()); // JSON 요청 본문 처리
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 정적 파일 제공 경로 설정
app.use('/auth', authRouter); // auth 라우터 사용

mongoose.connect('mongodb://localhost:27017/chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 50000 // 타임아웃 시간 증가
})
.then(() => console.log('MongoDB connected'))
.catch(error => console.error('MongoDB connection error:', error));

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

  socket.on('join', (nickname) => {
    const existingUser = users.find(user => user.id === socket.id);
    if (!existingUser) {
      users.push({ id: socket.id, nickname });
      io.emit('users', users);
      io.emit('receiveMessage', { nickname: 'System', text: `${nickname} joined the chat` });
    }
  });

  socket.on('sendMessage', async (message) => {
    const newMessage = new Message(message);
    await newMessage.save();
    io.emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    const user = users.find(user => user.id === socket.id);
    if (user) {
      users = users.filter(user => user.id !== socket.id);
      io.emit('users', users);
      io.emit('receiveMessage', { nickname: 'System', text: `${user.nickname} left the chat` });
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
  console.log(`Fetching messages for page: ${page}, limit: ${limit}`);
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    console.log(`Fetched messages: ${messages.length}`);
    res.json(messages);
  } catch (error) {
    console.error('Failed to load messages:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
