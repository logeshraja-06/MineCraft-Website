const rateLimit = require('express-rate-limit');

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate-limit challenge gameplay, submissions, tasks, or health checks
    const url = req.originalUrl || req.url || '';
    return url.includes('/challenges') || url.includes('/submissions') || req.path === '/health';
  },
  message: { success: false, message: 'Too many requests, please try again later.' },
});

exports.submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Submission rate limit exceeded. Please wait a moment.' },
});

