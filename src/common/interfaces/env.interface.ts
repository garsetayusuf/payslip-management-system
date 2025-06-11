import { EnvironmentEnum } from '../enum/environment.enum';

export interface EnvConfiguration {
  environment: EnvironmentEnum;
  port: number;
  cors: { origin: string[] };
  jwt: {
    secret: string;
    expires: string;
  };
  auth: {
    passwordSaltRounds: number;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}
