const session = require('express-session');
const connectMongo = require('connect-mongo');
require('dotenv').config();

const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;
const sessionSecret = process.env.SESSION_SECRET || 'chatapp-dev-session-secret';
const isProduction = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction;
const cookieSameSite = process.env.COOKIE_SAMESITE || (cookieSecure ? 'none' : 'lax');

const sessionConfig = session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60,
  }),
  cookie: {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge: 1000 * 60 * 60 * 24 * 14,
  },
});

module.exports = sessionConfig;
