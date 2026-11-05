import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  readonly port: number;
  readonly dbHost: string;
  readonly dbPort: number;
  readonly dbUser: string;
  readonly dbPassword: string;
  readonly dbName: string;
  readonly databaseUrl: string | undefined;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT ?? 3000),
  dbHost: process.env.DB_HOST ?? 'localhost',
  dbPort: Number(process.env.DB_PORT ?? 5432),
  dbUser: process.env.DB_USER ?? 'postgres',
  dbPassword: process.env.DB_PASSWORD ?? 'postgres',
  dbName: process.env.DB_NAME ?? 'financial_db',
  databaseUrl: process.env.DATABASE_URL,
};

