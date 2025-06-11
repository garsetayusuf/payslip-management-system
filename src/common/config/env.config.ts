import { EnvironmentEnum } from '../enum/environment.enum';
import { config as configDotenv } from 'dotenv';
import { EnvConfiguration } from '../interfaces/env.interface';

configDotenv();

export const loadConfig: () => EnvConfiguration = () => ({
  environment:
    (process.env.NODE_ENV as EnvironmentEnum) || EnvironmentEnum.Development,
  port: parseInt(process.env.PORT) || 3000,
  cors: { origin: process.env.CORS_ORIGIN?.split(',') },
  jwt: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES || '8h',
  },
  auth: {
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS) || 11,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
});
