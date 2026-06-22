const express = require('express');
const sequelize = require('./src/config/database');
const bcrypt = require('bcrypt');
const User = require('./models/user');
require('dotenv').config(); // Loads your .env variables into process.env
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { authenticateToken, JWT_SECRET } = require('./middleware/authenticateToken');
const roastRouter = require('./routes/roast');
// after app.use(express.json()):


const app = express();
const PORT = 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'https://resume-roaster-frontend-lime.vercel.app']
}));

app.use(express.json());
app.use('/api/roast', roastRouter);

// Verify database connection wrapper
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync(); // creates the Users table if missing

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

testConnection();

// Home Route
app.get('/', (req, res) => {
  res.send('Hello from your server.');
});

// ===== AUTH ROUTES =====

// SIGNUP ROUTE
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required fields'
      });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const userData = newUser.toJSON();
    delete userData.password;

    res.status(201).json(userData);

  } catch (error) {
    next(error);
  }
});

// LOGIN ROUTE
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required fields'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });

  } catch (error) {
    next(error);
  }
});

// ===== USER ROUTES (protected) =====

app.get('/api/users', authenticateToken, async (req, res, next) => {
  try {
    console.log('Only authenticated users are accessing the api');
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  res.status(err.status || 500).json({
    error: err.status ? err.message : 'Internal Server Error'
  });
});
