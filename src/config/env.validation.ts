import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  // Database
  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  @IsOptional()
  DB_SCHEMA: string;

  @IsNumber()
  @IsOptional()
  DB_POOL_MAX: number;

  @IsNumber()
  @IsOptional()
  DB_POOL_MIN: number;

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string;

  // Redis
  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number;

  @IsNumber()
  @IsOptional()
  REDIS_TTL: number;

  // Nepal
  @IsString()
  @IsOptional()
  TIMEZONE: string;

  @IsString()
  @IsOptional()
  DEFAULT_LANGUAGE: string;

  // Frontend
  @IsString()
  @IsOptional()
  FRONTEND_URL: string;

  // Encryption
  @IsString()
  @IsOptional()
  ENCRYPTION_KEY: string;

  @IsString()
  @IsOptional()
  ENCRYPTION_IV: string;

  // CORS
  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS: string;

  // ============ Payment Gateways ============

  // eKhalti
  @IsString()
  @IsOptional()
  EKHALTI_PUBLIC_KEY: string;

  @IsString()
  @IsOptional()
  EKHALTI_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  EKHALTI_API_URL: string;

  // ConnectIPS
  @IsString()
  @IsOptional()
  CONNECTIPS_MERCHANT_ID: string;

  @IsString()
  @IsOptional()
  CONNECTIPS_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  CONNECTIPS_API_URL: string;

  // Stripe
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET: string;

  // PayPal
  @IsString()
  @IsOptional()
  PAYPAL_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  PAYPAL_CLIENT_SECRET: string;

  @IsString()
  @IsOptional()
  PAYPAL_MODE: string;

  // ============ Video Conferencing ============

  // Jitsi
  @IsString()
  @IsOptional()
  JITSI_DOMAIN: string;

  // Zoom
  @IsString()
  @IsOptional()
  ZOOM_API_KEY: string;

  @IsString()
  @IsOptional()
  ZOOM_API_SECRET: string;

  // Google Meet
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET: string;

  // ============ File Upload ============

  @IsString()
  @IsOptional()
  UPLOAD_PATH: string;

  @IsNumber()
  @IsOptional()
  MAX_FILE_SIZE: number;

  // ============ SMS/Email Notifications ============

  // Twilio
  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID: string;

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN: string;

  @IsString()
  @IsOptional()
  TWILIO_PHONE_NUMBER: string;

  // WhatsApp
  @IsString()
  @IsOptional()
  WHATSAPP_TOKEN: string;

  @IsString()
  @IsOptional()
  WHATSAPP_PHONE_NUMBER: string;

  // SMTP
  @IsString()
  @IsOptional()
  SMTP_HOST: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT: number;

  @IsString()
  @IsOptional()
  SMTP_USER: string;

  @IsString()
  @IsOptional()
  SMTP_PASS: string;

  @IsString()
  @IsOptional()
  SMTP_FROM: string;

  // ============ AI Services ============

  @IsString()
  @IsOptional()
  OPENAI_API_KEY: string;

  // ============ Logging ============

  @IsString()
  @IsOptional()
  LOG_LEVEL: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
