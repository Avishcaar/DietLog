const express = require('express');
const path = require('path');
const { connection } = require('./db');
const { userRouter } = require('./Routes/users.route');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://health-bot-olive.vercel.app',
  'https://health-fjb6cfnq4-aavishkarkgmailcoms-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Allow if it matches any allowed origin or starts with the allowed origin
    // This catches trailing slashes and subpaths if any weird preflight occurs
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Temporarily allow all for portfolio deployment stability
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/', userRouter);

// Serve static assets from frontend build
const frontendBuildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuildPath));

// Fallback: for any request that does not match an API route or static file, serve index.html (SPA routing)
app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await connection;
    console.log(`Connected to Mongo Atlas on port ${PORT}`);
  } catch (err) {
    console.log(err);
  }
});