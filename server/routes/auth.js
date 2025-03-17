// server/routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { redisClient } = require('../config/redis');
const chalk = require('chalk');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(
      chalk.blue('🔍 Register Attempt:') + chalk.cyan(` Email: ${email}, Password: ${password}`)
    );

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log(chalk.yellow('⚠️ Register Failed:') + ' Username or email already exists');
      return res.status(400).json({
        status: 'error',
        message: 'Username or email already exists. Please choose a different one.',
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(chalk.blue('🔑 Hashed Password:') + chalk.cyan(` ${hashedPassword}`));

    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    console.log(chalk.blue('🔑 Stored Hash:') + chalk.cyan(` ${user.password}`));

    const accessToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    console.log(chalk.green('✅ Register Successful:') + chalk.cyan(` ${email}`));
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { accessToken },
    });
  } catch (err) {
    console.error(chalk.red('❌ Register Error:'), err);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      details: err.message,
    });
  }
});

router.post('/login', passport.authenticate('local', { session: false }), async (req, res) => {
  try {
    const { email } = req.body;
    const user = req.user;

    const accessToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    await redisClient.set(`refresh:${user._id}`, refreshToken, 'EX', 604800); // 7 days in seconds
    console.log(chalk.green('✅ Refresh Token Stored:') + chalk.cyan(` User ${user._id}`));

    console.log(chalk.green('✅ Login Successful:') + chalk.cyan(` ${email}`));
    res.json({
      status: 'success',
      message: 'Logged in successfully',
      data: { accessToken, refreshToken },
    });
  } catch (err) {
    console.error(chalk.red('❌ Login Error:'), err);
    res.status(500).json({ status: 'error', message: 'Login failed', details: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  console.log(chalk.blue('🔄 Refresh Attempt:'));

  if (!refreshToken) {
    console.log(chalk.yellow('⚠️ Refresh Failed:') + ' No refresh token provided');
    return res.status(401).json({
      status: 'error',
      message: 'Refresh token required',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redisClient.get(`refresh:${decoded.id}`);

    if (storedToken !== refreshToken) {
      console.log(chalk.yellow('⚠️ Refresh Failed:') + ' Invalid refresh token');
      return res.status(403).json({
        status: 'error',
        message: 'Invalid refresh token',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log(chalk.yellow('⚠️ Refresh Failed:') + ' User not found');
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    console.log(chalk.green('✅ Token Refreshed:') + chalk.cyan(` ${user.username}`));
    res.json({
      status: 'success',
      message: 'Token refreshed',
      data: { accessToken },
    });
  } catch (err) {
    console.error(chalk.red('❌ Refresh Error:'), err);
    res.status(403).json({
      status: 'error',
      message: 'Invalid refresh token',
      details: err.message,
    });
  }
});

router.get('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      await redisClient.del(`refresh:${decoded.id}`);
      console.log(chalk.green('✅ Logout Successful:') + chalk.cyan(` User ${decoded.id}`));
    } else {
      console.log(chalk.yellow('⚠️ Logout Warning:') + ' No token provided');
    }

    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    console.error(chalk.red('❌ Logout Error:'), err);
    res.status(500).json({
      status: 'error',
      message: 'Logout failed',
      details: err.message,
    });
  }
});

module.exports = router;