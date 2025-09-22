const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cinemaRoutes = require('./routes/cinemas');
const screenRoutes = require('./routes/screens');
const movieRoutes = require('./routes/movies');
const showRoutes = require('./routes/shows');
const authMiddleware = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorHandler');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Public routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes
app.use('/api/cinemas', authMiddleware, cinemaRoutes);
app.use('/api/screens', authMiddleware, screenRoutes);
app.use('/api/movies', authMiddleware, movieRoutes);
app.use('/api/shows', authMiddleware, showRoutes);

app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Profile data retrieved successfully',
    data: {
      user: req.user
    }
  });
});

// Error handling middleware 
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;