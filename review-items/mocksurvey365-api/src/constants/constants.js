require("dotenv/config");

const CONSTANTS = Object.freeze({
    PORT: process.env.PORT,
    DB: process.env.DB,
    HEALTH: process.env.HEALTH,
    ENV: process.env.ENV,
    VERSION: process.env.VERSION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_KEY_ID: process.env.AWS_SECRET_KEY_ID,
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    JWT_SECRET: process.env.JWT_SECRET,
    API_BASE_URL: process.env.API_BASE_URL,
    CP_URL: process.env.CP_URL,
    EMAIL_API_KEY: process.env.EMAIL_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GAMMA_API_KEY: process.env.GAMMA_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    SITE_LOGIN_URL: process.env.SITE_LOGIN_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_DB: process.env.REDIS_DB
  });
  
  
  module.exports = CONSTANTS;