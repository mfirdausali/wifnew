import Joi from 'joi';

// Define environment variable schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().default('noreply@localhost'),
}).unknown();

// Validate environment variables
const { error, value: validatedEnv } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const env = {
  nodeEnv: validatedEnv.NODE_ENV as 'development' | 'production' | 'test',
  port: validatedEnv.PORT as number,
  database: {
    url: validatedEnv.DATABASE_URL as string,
  },
  redis: {
    url: validatedEnv.REDIS_URL as string,
  },
  jwt: {
    secret: validatedEnv.JWT_SECRET as string,
    accessTokenExpiresIn: validatedEnv.JWT_ACCESS_TOKEN_EXPIRES_IN as string,
    refreshTokenExpiresIn: validatedEnv.JWT_REFRESH_TOKEN_EXPIRES_IN as string,
  },
  cors: {
    origin: validatedEnv.CORS_ORIGIN as string,
  },
  logging: {
    level: validatedEnv.LOG_LEVEL as string,
  },
  email: {
    host: validatedEnv.EMAIL_HOST as string | undefined,
    port: validatedEnv.EMAIL_PORT as number | undefined,
    user: validatedEnv.EMAIL_USER as string | undefined,
    pass: validatedEnv.EMAIL_PASS as string | undefined,
    from: validatedEnv.EMAIL_FROM as string,
  },
};