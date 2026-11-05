import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env';

const poolConfig: PoolConfig = env.databaseUrl
  ? { connectionString: env.databaseUrl }
  : {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

