// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const chalk = require('chalk');
const { redisClient, connectRedis } = require('./config/redis');

const app = express();

// Initialize Passport
require('./config/passport');
app.use(passport.initialize());

connectRedis().catch((err) => {
  console.error(chalk.red.bold('❌ Redis Connection Error:'), err);
  process.exit(1);
});

// MongoDB Connection
const dbURI =
  process.env.NODE_ENV === 'production'
    ? process.env.DB_URI_PRODUCTION
    : 'mongodb://localhost/auth-system';

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log(
      chalk.green.bold('📡 MongoDB Connected:') + chalk.cyan(` ${dbURI.split('/').pop()}`)
    )
  )
  .catch((err) => {
    console.error(chalk.red.bold('❌ MongoDB Connection Error:'), err);
    process.exit(1);
  });

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Logging Middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve Static Files
app.use(express.static('public'));

// Health Check API
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  console.log(chalk.green.bold('📊 Health Check:') + chalk.cyan(` DB: ${dbStatus}`));
  res.status(200).json({
    status: 'success',
    message: 'System Health Check',
    data: {
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
  });
});

// Authentication Routes
app.use('/auth', authRoutes);

// Check Authentication Status with Passport JWT
app.get('/auth/status', passport.authenticate('jwt', { session: false }), (req, res) => {
  console.log(
    chalk.blue('🔍 Auth Status Checked:') + ` User ${req.user.username} is authenticated`
  );
  res.json({
    status: 'success', // Matches front-end expectation
    message: 'Authentication status verified',
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
      },
    },
  });
});

// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error(chalk.red.bold('❌ Server Error:') + ` ${err.stack}`);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    details: err.message,
    timestamp: new Date().toISOString(),
  });
};
app.use(errorHandler);

// Start Server Function
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(chalk.green.bold('✅ Server Running:') + chalk.cyan(` Port ${PORT}`));
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(chalk.yellow.bold(`🔻 Shutting Down Gracefully due to ${signal}...`));

      if (server.shuttingDown) return;
      server.shuttingDown = true;

      try {
        await new Promise((resolve) => server.close(resolve));
        console.log(chalk.yellow('🚪 Express Server Closed'));

        await mongoose.connection.close(false);
        console.log(chalk.yellow('📡 MongoDB Disconnected'));

        await redisClient.quit();
        console.log(chalk.yellow('🗄️ Redis Disconnected'));

        console.log(chalk.blue.bold('💤 Server Exited'));
        process.exit(0);
      } catch (err) {
        console.error(chalk.red.bold('❌ Shutdown Error:'), err);
        process.exit(1);
      }
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (err) => {
      console.error(chalk.red.bold('❌ Unhandled Rejection:'), err.stack);
      shutdown('unhandledRejection');
    });
  } catch (error) {
    console.error(
      chalk.red.bold('❌ Failed to Start Server:') + chalk.white(` ${error.message}`)
    );
    process.exit(1);
  }
};

startServer();