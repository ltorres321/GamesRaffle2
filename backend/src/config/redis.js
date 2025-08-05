const redis = require('redis');
const config = require('./config');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionString = config.redis.connectionString;
    this.options = config.redis.options;
    this.keyPrefixes = config.redis.keyPrefixes;
    this.ttl = config.redis.ttl;
  }

  async connect() {
    try {
      logger.info('Initializing Redis connection...');
      
      if (!this.connectionString) {
        throw new Error('Redis connection string is not configured');
      }

      // Create Redis client
      this.client = redis.createClient({
        url: this.connectionString,
        ...this.options
      });

      // Handle Redis events
      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
      // Test the connection
      await this.ping();
      
      logger.info('Redis connection established successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Redis connection:', error);
      throw error;
    }
  }

  async ping() {
    try {
      const result = await this.client.ping();
      return result;
    } catch (error) {
      logger.error('Redis ping failed:', error);
      throw error;
    }
  }

  async isHealthy() {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      
      const result = await this.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  // Key management helpers
  getKey(prefix, key) {
    return `${this.keyPrefixes[prefix] || prefix}${key}`;
  }

  // Session management
  async setSession(sessionId, data, ttl = this.ttl.session) {
    const key = this.getKey('session', sessionId);
    return await this.client.setEx(key, ttl, JSON.stringify(data));
  }

  async getSession(sessionId) {
    const key = this.getKey('session', sessionId);
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    const key = this.getKey('session', sessionId);
    return await this.client.del(key);
  }

  async extendSession(sessionId, ttl = this.ttl.session) {
    const key = this.getKey('session', sessionId);
    return await this.client.expire(key, ttl);
  }

  // Cache management
  async setCache(key, data, ttl = this.ttl.cache) {
    const cacheKey = this.getKey('cache', key);
    const value = typeof data === 'string' ? data : JSON.stringify(data);
    return await this.client.setEx(cacheKey, ttl, value);
  }

  async getCache(key) {
    const cacheKey = this.getKey('cache', key);
    const data = await this.client.get(cacheKey);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      // If parsing fails, return as string
      return data;
    }
  }

  async deleteCache(key) {
    const cacheKey = this.getKey('cache', key);
    return await this.client.del(cacheKey);
  }

  async invalidateCachePattern(pattern) {
    const searchPattern = this.getKey('cache', pattern);
    const keys = await this.client.keys(searchPattern);
    
    if (keys.length > 0) {
      return await this.client.del(keys);
    }
    
    return 0;
  }

  // ESPN API caching
  async cacheESPNData(endpoint, data, ttl = this.ttl.espnData) {
    const key = `espn:${endpoint}`;
    return await this.setCache(key, data, ttl);
  }

  async getESPNCache(endpoint) {
    const key = `espn:${endpoint}`;
    return await this.getCache(key);
  }

  // Game data caching
  async cacheGameData(gameId, data, ttl = this.ttl.gameData) {
    const key = `game:${gameId}`;
    return await this.setCache(key, data, ttl);
  }

  async getGameCache(gameId) {
    const key = `game:${gameId}`;
    return await this.getCache(key);
  }

  async invalidateGameCache(gameId) {
    const pattern = `game:${gameId}*`;
    return await this.invalidateCachePattern(pattern);
  }

  // User picks caching (temporary storage)
  async cacheTempPick(userId, gameWeekId, pickData, ttl = this.ttl.temp) {
    const key = this.getKey('temp', `pick:${userId}:${gameWeekId}`);
    return await this.client.setEx(key, ttl, JSON.stringify(pickData));
  }

  async getTempPick(userId, gameWeekId) {
    const key = this.getKey('temp', `pick:${userId}:${gameWeekId}`);
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteTempPick(userId, gameWeekId) {
    const key = this.getKey('temp', `pick:${userId}:${gameWeekId}`);
    return await this.client.del(key);
  }

  // Leaderboard caching
  async cacheLeaderboard(gameId, leaderboardData, ttl = this.ttl.cache) {
    const key = `leaderboard:${gameId}`;
    return await this.setCache(key, leaderboardData, ttl);
  }

  async getLeaderboard(gameId) {
    const key = `leaderboard:${gameId}`;
    return await this.getCache(key);
  }

  async invalidateLeaderboard(gameId) {
    const key = `leaderboard:${gameId}`;
    return await this.deleteCache(key);
  }

  // Rate limiting
  async incrementRateLimit(identifier, windowMs = 15 * 60 * 1000) {
    const key = this.getKey('rate', identifier);
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.pExpire(key, windowMs);
    }
    
    return current;
  }

  async getRateLimit(identifier) {
    const key = this.getKey('rate', identifier);
    const current = await this.client.get(key);
    return current ? parseInt(current) : 0;
  }

  // Distributed locking
  async acquireLock(lockKey, ttl = 30000, retryDelay = 100, maxRetries = 10) {
    const key = this.getKey('lock', lockKey);
    const value = `${Date.now()}-${Math.random()}`;
    
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.client.set(key, value, {
        PX: ttl,
        NX: true
      });
      
      if (result === 'OK') {
        return value; // Lock acquired
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    throw new Error(`Failed to acquire lock: ${lockKey}`);
  }

  async releaseLock(lockKey, lockValue) {
    const key = this.getKey('lock', lockKey);
    
    // Lua script to ensure we only delete if the value matches
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    
    return await this.client.eval(luaScript, {
      keys: [key],
      arguments: [lockValue]
    });
  }

  // Pub/Sub for real-time updates
  async publish(channel, message) {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    return await this.client.publish(channel, data);
  }

  async subscribe(channel, callback) {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        callback(message);
      }
    });
    
    return subscriber;
  }

  // Bulk operations
  async mget(keys) {
    if (keys.length === 0) return [];
    return await this.client.mGet(keys);
  }

  async mset(keyValuePairs) {
    if (keyValuePairs.length === 0) return;
    return await this.client.mSet(keyValuePairs);
  }

  // Hash operations for complex data structures
  async hset(key, field, value) {
    const hashKey = this.getKey('hash', key);
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    return await this.client.hSet(hashKey, field, data);
  }

  async hget(key, field) {
    const hashKey = this.getKey('hash', key);
    const data = await this.client.hGet(hashKey, field);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  }

  async hgetall(key) {
    const hashKey = this.getKey('hash', key);
    const data = await this.client.hGetAll(hashKey);
    
    const result = {};
    Object.keys(data).forEach(field => {
      try {
        result[field] = JSON.parse(data[field]);
      } catch (error) {
        result[field] = data[field];
      }
    });
    
    return result;
  }

  async hdel(key, fields) {
    const hashKey = this.getKey('hash', key);
    return await this.client.hDel(hashKey, fields);
  }

  // Cleanup and connection management
  async flushCache() {
    try {
      const pattern = this.getKey('cache', '*');
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
      
      return 0;
    } catch (error) {
      logger.error('Error flushing cache:', error);
      throw error;
    }
  }

  async quit() {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  // Stats and monitoring
  async getStats() {
    try {
      const info = await this.client.info();
      const keyCount = await this.client.dbSize();
      
      return {
        connected: this.isConnected,
        keyCount,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      logger.error('Error getting Redis stats:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });
    
    return result;
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;