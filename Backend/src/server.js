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


// 🔥 REQUIRED for devtunnel / proxies (HTTPS + cookies)
app.set("trust proxy", 1);


// ✅ CORS (supports credentials + dynamic origin)
app.use(cors({
  origin: function(origin, callback) {
    callback(null, origin); // reflect request origin
  },
  credentials: true
}));


// ✅ Middleware
app.use(express.json());


// ✅ Session (must come AFTER trust proxy)
app.use(sessionConfig);


// ✅ Test route (for debugging tunnel)
app.get("/", (req, res) => {
  res.send("🚀 Server is working!");
});


// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);


// ✅ Port
const PORT = process.env.PORT || 5000;


// ✅ Start server AFTER DB connection
connectDB()
  .then(() => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // ✅ Initialize Socket.io
    const io = initSocket(server);
    app.set('io', io);
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });