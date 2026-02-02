const CONSTANTS = require("../constants/constants");

// Helper function to get password only if it exists and is not empty
const getRedisPassword = () => {
  return (CONSTANTS.REDIS_PASSWORD && CONSTANTS.REDIS_PASSWORD.trim() !== '') 
    ? CONSTANTS.REDIS_PASSWORD 
    : undefined;
};

const redisConfig = {
  // Development configuration
  development: {
    host: CONSTANTS.REDIS_HOST || 'localhost',
    port: parseInt(CONSTANTS.REDIS_PORT) || 6379,
    password: getRedisPassword(),
    db: parseInt(CONSTANTS.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  },

  // Production configuration
  production: {
    host: CONSTANTS.REDIS_HOST || 'localhost',
    port: parseInt(CONSTANTS.REDIS_PORT) || 6379,
    password: getRedisPassword(),
    db: parseInt(CONSTANTS.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 5,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 15000,
    commandTimeout: 10000,
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 5000);
      return delay;
    }
  },

  // Test configuration
  test: {
    host: CONSTANTS.REDIS_HOST || 'localhost',
    port: parseInt(CONSTANTS.REDIS_PORT) || 6379,
    password: getRedisPassword(),
    db: parseInt(CONSTANTS.REDIS_DB) || 0, // Use different DB for tests
    retryDelayOnFailover: 50,
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 2000,
    retryStrategy: () => null // Don't retry in tests
  }
};

/**
 * Lock configuration settings
 */
const lockConfig = {
  // Default lock settings
  defaultTTL: 30, // seconds
  defaultTimeout: 5000, // milliseconds
  
  // Operation-specific lock settings
  operations: {
    'initial_pool_team_member': {
      ttl: 15,
      timeout: 8000,
      description: 'Team member initial pool updates'
    },
    'team_lead_initial_pool': {
      ttl: 20,
      timeout: 10000,
      description: 'Team lead initial pool updates'
    },
    'team_lead_investigation': {
      ttl: 25,
      timeout: 12000,
      description: 'Team lead investigation updates'
    },
    'team_member_investigation': {
      ttl: 20,
      timeout: 10000,
      description: 'Team member investigation updates'
    },
    'facility_tasks': {
      ttl: 15,
      timeout: 8000,
      description: 'Facility task updates'
    },
    'risk_based_resident': {
      ttl: 20,
      timeout: 10000,
      description: 'Risk-based resident updates'
    },
    'risk_based_nonresident': {
      ttl: 20,
      timeout: 10000,
      description: 'Risk-based non-resident updates'
    }
  },

  // Lock key patterns
  keyPatterns: {
    survey: 'survey:{surveyId}:{operation}',
    user: 'survey:{surveyId}:{operation}:{userId}',
    teamMember: 'survey:{surveyId}:{operation}:{teamMemberId}',
    global: '{operation}'
  }
};

/**
 * Get Redis configuration for current environment
 */
function getRedisConfig() {
  const env = process.env.NODE_ENV || 'development';
  return redisConfig[env] || redisConfig.development;
}

/**
 * Get lock configuration for operation
 */
function getLockConfig(operation) {
  return lockConfig.operations[operation] || {
    ttl: lockConfig.defaultTTL,
    timeout: lockConfig.defaultTimeout,
    description: `Generic ${operation} operation`
  };
}

/**
 * Generate Redis connection URL (for external tools)
 */
function getRedisUrl() {
  const config = getRedisConfig();
  const auth = config.password ? `:${config.password}@` : '';
  return `redis://${auth}${config.host}:${config.port}/${config.db}`;
}

/**
 * Validate Redis configuration
 */
function validateConfig() {
  const config = getRedisConfig();
  const errors = [];

  if (!config.host) {
    errors.push('Redis host is required');
  }

  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('Redis port must be between 1 and 65535');
  }

  if (config.db < 0 || config.db > 15) {
    errors.push('Redis database must be between 0 and 15');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  redisConfig,
  lockConfig,
  getRedisConfig,
  getLockConfig,
  getRedisUrl,
  validateConfig
};
