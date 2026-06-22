const jwt = require('jsonwebtoken');

// Loaded from your .env file via require('dotenv').config() in server.js.
// Add JWT_SECRET=your_long_random_string to a .env file in your project root.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_only_secret_change_me';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // expects "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decodedUser;
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };