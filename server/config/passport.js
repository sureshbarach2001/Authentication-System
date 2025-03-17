// server/config/passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const chalk = require('chalk');

// Local Strategy (for login with email/password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email', // Use email instead of username
    },
    async (email, password, done) => {
      try {
        console.log(chalk.blue.bold('🔍 Authenticating User:') + chalk.cyan(` ${email}`));
        const user = await User.findOne({ email });
        if (!user) {
          console.log(chalk.yellow('⚠️ Login Failed:') + ' Incorrect email');
          return done(null, false, { message: 'Incorrect email' });
        }

        console.log(chalk.blue('🔑 Stored Hash:') + chalk.cyan(` ${user.password}`));
        console.log(chalk.blue('🔑 Input Password:') + chalk.cyan(` ${password}`));

        const isValid = await bcrypt.compare(password, user.password);
        console.log(chalk.blue('🔑 Comparison Result:') + chalk.cyan(` ${isValid}`));

        if (!isValid) {
          console.log(
            chalk.yellow('⚠️ Login Failed:') + ' Incorrect password for ' + chalk.cyan(email)
          );
          return done(null, false, { message: 'Incorrect password' });
        }

        console.log(chalk.green.bold('✅ Login Successful:') + chalk.cyan(` ${email}`));
        return done(null, user);
      } catch (err) {
        console.error(chalk.red.bold('❌ Authentication Error:') + ` ${err.message}`);
        return done(err);
      }
    }
  )
);

// JWT Strategy (for token-based auth)
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      console.log(chalk.blue.bold('🔍 Verifying JWT:') + chalk.cyan(` User ID ${jwtPayload.id}`));
      const user = await User.findById(jwtPayload.id);
      if (!user) {
        console.log(chalk.yellow('⚠️ JWT Verification Failed:') + ' User not found');
        return done(null, false);
      }
      console.log(chalk.green.bold('✅ JWT Verified:') + chalk.cyan(` ${user.email}`));
      return done(null, user);
    } catch (err) {
      console.error(chalk.red.bold('❌ JWT Verification Error:') + ` ${err.message}`);
      return done(err);
    }
  })
);

// Serialize and Deserialize (unchanged)
passport.serializeUser((user, done) => {
  console.log(
    chalk.blue.bold('🔒 Serializing User:') + chalk.cyan(` ${user.username} (ID: ${user.id})`)
  );
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      console.log(
        chalk.yellow('⚠️ Deserialization Failed:') + ` User ID ${id} not found`
      );
      return done(null, null);
    }
    console.log(
      chalk.green.bold('🔓 Deserialized User:') + chalk.cyan(` ${user.username} (ID: ${id})`)
    );
    done(null, user);
  } catch (err) {
    console.error(chalk.red.bold('❌ Deserialization Error:') + ` ${err.message}`);
    done(err);
  }
});

module.exports = passport;