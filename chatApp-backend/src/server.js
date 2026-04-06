const express = require('express');
const cors = require('cors'); // ⚡ 1. Import CORS
// Change these to remove '/src'
const connectDB = require('./config/db');
const sessionConfig = require('./config/session');
const initSocket = require('./sockets');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');


const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,               // CRITICAL: Allows session cookies to be sent back and forth
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(sessionConfig);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running cleanly on port ${PORT}`);
  });

  const io = initSocket(server);
  app.set('io', io);
});
