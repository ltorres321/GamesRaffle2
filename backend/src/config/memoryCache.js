const logger = require('../utils/logger');

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.sessions = new Map();
    this.rateLimits = new Map();
    this.locks = new Map();
    this.isConnected = true;
    
    // Cleanup interval for expired items (every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
    
    logger.info('Memory cache initialized');
  }

  async connect() {
    // Memory cache is always "connected"
    this.isConnected = true;
    logger.info('Memory cache ready');
    return Promise.resolve();
  }

  async ping() {
    return 'PONG';
  }

  async isHealthy() {
    return this.isConnected;
  }

  // Generic cache operations
  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key, value, ttl = 3600) {
    const expiry = ttl > 0 ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, {
      value: value,
      expiry: expiry
    });
    return 'OK';
  }

  async setex(key, ttl, value) {
    return await this.set(key, value, ttl);
  }

  async del(key) {
    return this.cache.delete(key) ? 1 : 0;
  }

  async exists(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Session management
  async setSession(sessionId, data, ttl = 2592000) { // 30 days default
    const key = `session:${sessionId}`;
    return await this.set(key, JSON.stringify(data), ttl);
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  async extendSession(sessionId, ttl = 2592000) {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    if (data) {
      return await this.set(key, data, ttl);
    }
    return false;
  }

  // Cache management with JSON serialization
  async setCache(key, data, ttl = 3600) {
    const cacheKey = `cache:${key}`;
    const value = typeof data === 'string' ? data : JSON.stringify(data);
    return await this.set(cacheKey, value, ttl);
  }

  async getCache(key) {
    const cacheKey = `cache:${key}`;
    const data = await this.get(cacheKey);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  }

  async deleteCache(key) {
    const cacheKey = `cache:${key}`;
    return await this.del(cacheKey);
  }

  // SportRadar API caching
  async cacheSportRadarData(endpoint, data, ttl = 600) {
    const key = `sportradar:${endpoint}`;
    return await this.setCache(key, data, ttl);
  }

  async getSportRadarCache(endpoint) {
    const key = `sportradar:${endpoint}`;
    return await this.getCache(key);
  }

  // Game data caching
  async cacheGameData(gameId, data, ttl = 3600) {
    const key = `game:${gameId}`;
    return await this.setCache(key, data, ttl);
  }

  async getGameCache(gameId) {
    const key = `game:${gameId}`;
    return await this.getCache(key);
  }

  // Rate limiting (simple in-memory implementation)
  async incrementRateLimit(identifier, windowMs = 15 * 60 * 1000) {
    const key = `rate:${identifier}`;
    const now = Date.now();
    
    let rateData = this.rateLimits.get(key);
    if (!rateData || now > rateData.resetTime) {
      rateData = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateData.count++;
    }
    
    this.rateLimits.set(key, rateData);
    return rateData.count;
  }

  async getRateLimit(identifier) {
    const key = `rate:${identifier}`;
    const rateData = this.rateLimits.get(key);
    
    if (!rateData || Date.now() > rateData.resetTime) {
      return 0;
    }
    
    return rateData.count;
  }

  // Simple distributed locking (in-memory only, not truly distributed)
  async acquireLock(lockKey, ttl = 30000, retryDelay = 100, maxRetries = 10) {
    const key = `lock:${lockKey}`;
    const value = `${Date.now()}-${Math.random()}`;
    
    for (let i = 0; i < maxRetries; i++) {
      const existing = this.locks.get(key);
      const now = Date.now();
      
      if (!existing || now > existing.expiry) {
        this.locks.set(key, {
          value: value,
          expiry: now + ttl
        });
        return value;
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    throw new Error(`Failed to acquire lock: ${lockKey}`);
  }

  async releaseLock(lockKey, lockValue) {
    const key = `lock:${lockKey}`;
    const existing = this.locks.get(key);
    
    if (existing && existing.value === lockValue) {
      this.locks.delete(key);
      return 1;
    }
    
    return 0;
  }

  // Utility methods
  isExpired(item) {
    return item.expiry && Date.now() > item.expiry;
  }

  cleanup() {
    let cleaned = 0;
    
    // Clean expired cache items
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    // Clean expired rate limits
    const now = Date.now();
    for (const [key, rateData] of this.rateLimits.entries()) {
      if (now > rateData.resetTime) {
        this.rateLimits.delete(key);
        cleaned++;
      }
    }
    
    // Clean expired locks
    for (const [key, lockData] of this.locks.entries()) {
      if (now > lockData.expiry) {
        this.locks.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Memory cache cleanup: removed ${cleaned} expired items`);
    }
  }

  // Stats and monitoring
  getStats() {
    return {
      connected: this.isConnected,
      keyCount: this.cache.size,
      sessionCount: Array.from(this.cache.keys()).filter(k => k.startsWith('session:')).length,
      cacheCount: Array.from(this.cache.keys()).filter(k => k.startsWith('cache:')).length,
      rateLimitCount: this.rateLimits.size,
      lockCount: this.locks.size,
      memoryUsage: process.memoryUsage()
    };
  }

  // Cleanup on shutdown
  async quit() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cache.clear();
    this.sessions.clear();
    this.rateLimits.clear();
    this.locks.clear();
    this.isConnected = false;
    
    logger.info('Memory cache shut down');
    return Promise.resolve();
  }

  // Flush all cache (keep sessions)
  async flushCache() {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith('cache:')) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  // Additional methods to maintain compatibility with Redis interface
  async keys(pattern) {
    const keys = Array.from(this.cache.keys());
    if (pattern === '*') {
      return keys;
    }
    
    // Simple pattern matching (just prefix and suffix wildcards)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  async expire(key, ttl) {
    const item = this.cache.get(key);
    if (item) {
      item.expiry = Date.now() + (ttl * 1000);
      return 1;
    }
    return 0;
  }

  // Hash operations (simplified)
  async hset(key, field, value) {
    const hashKey = `hash:${key}`;
    let hash = await this.get(hashKey);
    
    if (!hash) {
      hash = {};
    } else if (typeof hash === 'string') {
      hash = JSON.parse(hash);
    }
    
    hash[field] = typeof value === 'string' ? value : JSON.stringify(value);
    await this.set(hashKey, JSON.stringify(hash));
    return 1;
  }

  async hget(key, field) {
    const hashKey = `hash:${key}`;
    const hash = await this.get(hashKey);
    
    if (!hash) return null;
    
    let parsedHash;
    try {
      parsedHash = typeof hash === 'string' ? JSON.parse(hash) : hash;
    } catch (error) {
      return null;
    }
    
    const value = parsedHash[field];
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
}

// Create singleton instance
const memoryCache = new MemoryCache();

module.exports = memoryCache;