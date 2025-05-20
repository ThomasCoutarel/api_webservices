import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100,
  message: {
    message: 'Trop de requêtes. Réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default generalLimiter;
