# 🚀 Modern Real-Time Chat Backend (WhatsApp Rival)

> **In short:** This repository contains the entire brain, nervous system, and database for a modern, highly scalable WhatsApp rival. 

Built with a modular Node.js architecture, this backend supports real-time WebSockets, robust privacy controls, temporary vanishing messages, and a natively integrated context-aware AI assistant.

---

## ✨ System Architecture & Features

### 🛡️ 1. Core Server & Security
* **Session-Based Authentication:** Built a highly secure session system using `express-session` and `connect-mongo` to keep users logged in via secure cookies (no JWTs required).
* **CORS Configured:** Securely wired to accept requests and cookies from the React frontend using `credentials: true`.
* **Centralized Error Handling:** Clean, modular controller and route structure wrapped in asynchronous error handlers.

### 👤 2. User Authentication & Lifecycle
* **Registration & Login:** Secure password hashing using `bcryptjs`.
* **OTP Email System:** Integrated **Nodemailer** to send real 6-digit OTPs to users for email verification upon signup and password resets.
* **Profile Management:** Users can dynamically update their name, bio, and avatar.
* **Account Deletion:** Full data lifecycle management allowing users to permanently delete their accounts and wipe sessions.
* **User Discovery:** A global search API to find new contacts by name or email.

### 💬 3. The Messaging Engine
* **1-on-1 & AI Chats:** Dynamic creation and fetching of individual chat rooms.
* **Group Chats:** Full group mechanics—creating groups, adding members, and removing members with Admin-level protections.
* **Smart Inbox Filters:** APIs that automatically filter chat lists by "unread", "groups", or "ai".
* **Message CUD (Create, Update, Delete):** Send text, edit existing messages, and delete messages.
* **Media Uploads:** Integrated **Cloudinary** and **Multer**. Media uploads to the cloud, saves the secure URL, and broadcasts instantly. A custom utility function automatically deletes the image from the cloud if the message is deleted.
* **Replying:** Added contextual `replyTo` data structures for swiping/replying to specific older messages.
* **Phantom Mode:** Temporary/vanishing chats powered by MongoDB TTL indexes that auto-delete from the database after a set duration.

### ⚡ 4. Real-Time WebSockets
* **Live Messaging:** Emitting and receiving messages instantly without HTTP polling.
* **Blue Ticks (Read Receipts):** A status system that marks messages as 'seen' the exact moment the other user opens the chat window.
* **Presence & Typing:** Live "User is typing..." indicators and "Online/Offline" presence tracking.
* **A/V Calling:** WebRTC signaling endpoints to ring another user's phone, accept/reject calls, and log the call history.

### 🤖 5. AI Assistant (`my.ai`)
* **Groq LPU Integration:** Built a blisteringly fast connection to the Groq API using the `llama3-8b-8192` model for native in-chat AI.
* **Context-Awareness:** The backend automatically fetches and feeds the last 30 messages of chat history to the AI so it remembers exactly what the conversation is about.

### 🔒 6. The Ultimate Privacy System
* **Block System:** Users can block and unblock others. The backend aggressively intercepts and halts all messages and WebRTC calls between blocked users.
* **WhatsApp-Style Toggles:** Users can hide their "Last Seen", "Online Status", and "Typing Indicators". The socket server checks the database in real-time and respects these toggles before broadcasting events.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB & Mongoose
* **Real-Time Engine:** Socket.io (with WebRTC signaling)
* **Authentication:** `express-session`, `connect-mongo`, `bcryptjs`
* **Media Storage:** Cloudinary & Multer
* **Email Service:** Nodemailer
* **AI Integration:** Groq API / LLaMA 3