const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const sessionConfig = require('./config/session');
const initSocket = require('./sockets');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();


// 🔥 IMPORTANT: REQUIRED for devtunnel / proxy
app.set("trust proxy", 1);


// ✅ Proper CORS for cookies
app.use(cors({
  origin: true,
  credentials: true
}));


// ✅ Body parser
app.use(express.json());


// ✅ Session (must come after trust proxy)
app.use(sessionConfig);


// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);


const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const io = initSocket(server);
  app.set('io', io);
});