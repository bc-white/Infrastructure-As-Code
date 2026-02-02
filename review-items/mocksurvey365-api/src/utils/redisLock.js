const redis = require('redis');
const crypto = require('crypto');
const CONSTANTS = require('../constants/constants');

class RedisLock {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.lockTimeouts = new Map(); // Track lock timeouts for cleanup
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      // Build Redis configuration for both local and cloud Redis
      const redisConfig = {
        socket: {
          host: CONSTANTS.REDIS_HOST || 'localhost',
          port: parseInt(CONSTANTS.REDIS_PORT) || 6379,
        },
        database: parseInt(CONSTANTS.REDIS_DB) || 0,
      };
      
      // Add authentication if password exists (for Redis Cloud)
      if (CONSTANTS.REDIS_PASSWORD && CONSTANTS.REDIS_PASSWORD.trim() !== '') {
        redisConfig.username = 'default'; // Redis Cloud default username
        redisConfig.password = CONSTANTS.REDIS_PASSWORD;
      }
      
      console.log('🔗 Connecting to Redis:', {
        host: redisConfig.socket.host,
        port: redisConfig.socket.port,
        hasPassword: !!redisConfig.password
      });
      
      this.client = redis.createClient(redisConfig);

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Acquire a distributed lock
   * @param {string} lockKey - Unique identifier for the lock
   * @param {number} ttl - Time to live in seconds (default: 30)
   * @param {number} timeout - Max time to wait for lock in ms (default: 5000)
   * @returns {Promise<string|null>} - Lock token if acquired, null if failed
   */
  async acquireLock(lockKey, ttl = 30, timeout = 5000) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping lock');
      return null;
    }

    const lockToken = crypto.randomUUID();
    const lockValue = JSON.stringify({
      token: lockToken,
      timestamp: Date.now(),
      ttl: ttl
    });

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // Try to acquire lock with SET NX EX (atomic operation)
        const result = await this.client.set(
          `lock:${lockKey}`, 
          lockValue, 
          {
            NX: true, // Only set if key doesn't exist
            EX: ttl   // Set expiration time
          }
        );

        if (result === 'OK') {
          console.log(`🔒 Lock acquired: ${lockKey} (token: ${lockToken})`);
          
          // Set up automatic cleanup timeout
          const timeoutId = setTimeout(() => {
            this.releaseLock(lockKey, lockToken);
          }, ttl * 1000);
          
          this.lockTimeouts.set(lockToken, timeoutId);
          
          return lockToken;
        }

        // Lock not available, wait a bit before retrying
        await this.sleep(50 + Math.random() * 50); // 50-100ms jitter
      } catch (error) {
        console.error(`Error acquiring lock ${lockKey}:`, error);
        break;
      }
    }

    console.warn(`⏰ Lock acquisition timeout: ${lockKey}`);
    return null;
  }

  /**
   * Release a distributed lock
   * @param {string} lockKey - Lock identifier
   * @param {string} lockToken - Token returned from acquireLock
   * @returns {Promise<boolean>} - True if released, false if failed
   */
  async releaseLock(lockKey, lockToken) {
    if (!this.isConnected || !lockToken) {
      return false;
    }

    try {
      // Lua script to atomically check token and delete lock
      const luaScript = `
        local current = redis.call('GET', KEYS[1])
        if current then
          local data = cjson.decode(current)
          if data.token == ARGV[1] then
            return redis.call('DEL', KEYS[1])
          end
        end
        return 0
      `;

      const result = await this.client.eval(luaScript, {
        keys: [`lock:${lockKey}`],
        arguments: [lockToken]
      });

      // Clear timeout if it exists
      if (this.lockTimeouts.has(lockToken)) {
        clearTimeout(this.lockTimeouts.get(lockToken));
        this.lockTimeouts.delete(lockToken);
      }

      if (result === 1) {
        console.log(`🔓 Lock released: ${lockKey} (token: ${lockToken})`);
        return true;
      } else {
        console.warn(`⚠️ Lock release failed: ${lockKey} (token mismatch or expired)`);
        return false;
      }
    } catch (error) {
      console.error(`Error releasing lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Execute a function with a distributed lock
   * @param {string} lockKey - Lock identifier
   * @param {Function} fn - Function to execute
   * @param {Object} options - Lock options
   * @returns {Promise<any>} - Result of the function
   */
  async withLock(lockKey, fn, options = {}) {
    const { ttl = 30, timeout = 5000, retryOnFailure = false } = options;
    
    const lockToken = await this.acquireLock(lockKey, ttl, timeout);
    
    if (!lockToken) {
      if (retryOnFailure) {
        throw new Error(`Failed to acquire lock: ${lockKey} - retry suggested`);
      } else {
        throw new Error(`Failed to acquire lock: ${lockKey} - operation aborted`);
      }
    }

    try {
      console.log(`🚀 Executing with lock: ${lockKey}`);
      const result = await fn();
      console.log(`✅ Completed with lock: ${lockKey}`);
      return result;
    } catch (error) {
      console.error(`❌ Error in locked operation ${lockKey}:`, error);
      throw error;
    } finally {
      await this.releaseLock(lockKey, lockToken);
    }
  }

  /**
   * Create survey-specific lock keys
   */
  static createLockKey(surveyId, operation, additionalId = '') {
    const key = `survey:${surveyId}:${operation}`;
    return additionalId ? `${key}:${additionalId}` : key;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get lock information
   */
  async getLockInfo(lockKey) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const lockValue = await this.client.get(`lock:${lockKey}`);
      if (lockValue) {
        return JSON.parse(lockValue);
      }
      return null;
    } catch (error) {
      console.error(`Error getting lock info ${lockKey}:`, error);
      return null;
    }
  }

  /**
   * Force release a lock (admin function)
   */
  async forceReleaseLock(lockKey) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.del(`lock:${lockKey}`);
      console.log(`🔨 Force released lock: ${lockKey}`);
      return result === 1;
    } catch (error) {
      console.error(`Error force releasing lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Cleanup expired locks and timeouts
   */
  async cleanup() {
    // Clear all timeouts
    for (const [token, timeoutId] of this.lockTimeouts) {
      clearTimeout(timeoutId);
    }
    this.lockTimeouts.clear();

    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Health check
   */
  async isHealthy() {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
const redisLock = new RedisLock();

module.exports = redisLock;
