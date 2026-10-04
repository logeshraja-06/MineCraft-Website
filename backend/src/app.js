const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorMiddleware');
const notFound = require('./middleware/notFoundMiddleware');
const { apiLimiter } = require('./middleware/rateLimit');

// Route imports
const submissionRoutes = require('./routes/submissionRoutes');
const authRoutes = require('./routes/authRoutes');
const participantRoutes = require('./routes/participantRoutes');
const eventRoutes = require('./routes/eventRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const qrRoutes = require('./routes/qrRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mind Craft backend is running',
  });
});

// Primary Submission API
app.use('/api/submissions', submissionRoutes);

// Optional mock & admin management routes
app.use('/api/auth', authRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
