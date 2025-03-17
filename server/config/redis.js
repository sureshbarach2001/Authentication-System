// server/config/redis.js
const redis = require('redis');
const chalk = require('chalk');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

redisClient.on('connect', () => {
    console.log(chalk.green.bold('🗄️ Redis Connected:') + 
                chalk.cyan(` ${redisClient.options.host}:${redisClient.options.port}`));
});

redisClient.on('ready', () => {
    console.log(chalk.green.bold('✅ Redis Ready:') + 
                chalk.cyan(' Client accepting commands'));
});

redisClient.on('error', (err) => {
    console.error(chalk.red.bold('❌ Redis Client Error:') + 
                 ` ${err.message}`);
});

redisClient.on('end', () => {
    console.log(chalk.yellow.bold('🔻 Redis Connection Closed'));
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log(chalk.blue.bold('🔄 Redis Connection Initiated'));
    } catch (err) {
        console.error(chalk.red.bold('❌ Redis Connection Failed:') + 
                     ` ${err.message}`);
        throw err;
    }
};

module.exports = { redisClient, connectRedis };