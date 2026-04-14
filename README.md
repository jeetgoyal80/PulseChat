# NexChat

NexChat is a full-stack real-time chat application built to deliver a modern messaging experience similar to WhatsApp Web or Telegram Web. It combines private messaging, group conversations, AI-assisted chat, voice and video calling, temporary messages, and installable PWA behavior in a single web application.

The project is structured as a frontend and backend monorepo, with a React + Vite client and an Express + MongoDB + Socket.io server. The app is designed around real-time communication, session-based authentication, and a responsive interface that works across desktop and mobile browsers.

## Highlights

- Real-time one-to-one and group messaging
- AI chat with draft-style workflows
- Voice and video calling with WebRTC signaling
- Typing indicators, presence, unread counts, and read receipts
- OTP-based signup and account verification flow
- Media and voice message support
- Temporary chat / disappearing message support
- Privacy controls and user blocking
- Installable PWA experience for supported browsers

## Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.io Client
- Framer Motion
- Sonner
- emoji-picker-react

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- Socket.io
- express-session
- connect-mongo
- bcryptjs
- Nodemailer
- Multer
- Cloudinary

### Real-Time / Communication

- Socket.io for real-time transport
- WebRTC for peer-to-peer voice and video calls
- Session cookies for authenticated socket and API access

## Project Structure

```text
NexChat/
├── Backend/              # Express + MongoDB + Socket.io backend
│   ├── src/
│   └── package.json
├── Frontend/
│   └── NexusCp/          # React + Vite frontend
└── README.md
```

## Core Features

### Messaging

- Private chats
- Group chats
- Media attachments
- Voice notes
- Message editing and deletion
- Real-time delivery without polling

### Real-Time Experience

- Instant message updates
- AI response updates in real time
- Typing indicators
- Online / offline presence
- Seen status and read receipts

### Calling

- Voice calls
- Video calls
- WebRTC offer / answer / ICE flow
- Incoming call UI
- Mute / unmute
- Camera on / off

### Authentication and Security

- Session-based login
- OTP email verification
- Password reset flow
- Protected API routes
- Cookie-based auth persistence

### Privacy

- Block / unblock users
- Last seen visibility
- Online status visibility
- Typing visibility controls

### Progressive Web App

- Web manifest
- Service worker registration
- Install prompt for supported browsers
- iOS fallback guidance for Add to Home Screen

## How It Works

NexChat follows a standard real-time architecture:

- REST APIs are used for authentication, initial data loading, and persistent write operations.
- Socket.io is used for live events such as incoming messages, typing, presence, call signaling, and AI response updates.
- WebRTC handles the media connection for voice and video calls.
- MongoDB stores users, chats, messages, sessions, OTP records, and call metadata.

## Setup

## 1. Clone the repository

```bash
git clone <your-repo-url>
cd NexChat
```

## 2. Install backend dependencies

```bash
cd Backend
npm install
```

## 3. Install frontend dependencies

```bash
cd ../Frontend/NexusCp
npm install
```

## 4. Configure environment variables

Create a `.env` file inside `Backend/` with values similar to:

```env
PORT=5000
MONGO_URI=
SESSION_SECRET=
FRONTEND_URL=http://localhost:8080
FRONTEND_URLS=http://localhost:8080,http://127.0.0.1:8080

EMAIL_USER=
EMAIL_PASS=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GROQ_API_KEY=
```

For frontend runtime configuration, add a `.env` file inside `Frontend/NexusCp/` if needed:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Optional TURN config for production calling
VITE_TURN_SERVER_URL=
VITE_TURN_SERVER_USERNAME=
VITE_TURN_SERVER_CREDENTIAL=
```

## 5. Run the backend

```bash
cd Backend
npm run dev
```

## 6. Run the frontend

```bash
cd Frontend/NexusCp
npm run dev
```

Frontend default development server:

- `http://localhost:8080`

Backend default server:

- `http://localhost:5000`

## Available Scripts

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Production Notes

- HTTPS is required in production for camera and microphone access.
- Mobile voice/video calls are more reliable with a TURN server configured.
- PWA install prompts depend on browser rules and may not appear immediately.
- iOS Safari does not support `beforeinstallprompt`; users must use Add to Home Screen manually.
- Session cookie settings and CORS origins should be configured for your deployed frontend domain.

## Suggested Use Cases

- Real-time team chat
- Customer communication portals
- AI-assisted messaging platforms
- Private chat and collaboration tools
- PWA-based communication products

## Future Improvements

- Push notifications
- End-to-end encryption
- Message reactions
- Message forwarding
- Advanced search
- Delivery analytics

## Author

Built as a full-stack real-time communication project using React, Vite, Node.js, MongoDB, Socket.io, WebRTC, and PWA capabilities.
