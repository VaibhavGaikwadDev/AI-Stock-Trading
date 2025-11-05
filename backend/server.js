const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
const dotenv = require('dotenv');
// dotenv.config();
dotenv.config({ override: true })

const app = express();
const PORT = process.env.PORT || 5000;

// Logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts, try again later' }
});
app.use('/api/auth', limiter);

// DB Connection
const db = require('./config/db');
db.execute('SELECT 1').then(() => logger.info('MySQL connected')).catch(err => logger.error('DB Error:', err));

// Auth Middleware
const authenticateJWT = require('./middleware/auth');

// Routes
app.use('/api/users', authenticateJWT, require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', authenticateJWT, require('./routes/wallet'));
app.use('/api/admin', authenticateJWT, require('./routes/admin'));
app.use('/api/stock', authenticateJWT, require('./routes/stock'));

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => logger.info(`Server on port ${PORT}`));