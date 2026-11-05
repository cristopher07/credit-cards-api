import fs from 'fs';
import path from 'path';
import { pool } from './pool';

export async function initializeDatabase(): Promise<void> {
  const sqlFilePath = path.resolve(__dirname, '../../sql/init.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf-8');
  await pool.query(sql);
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Base de datos inicializada correctamente (tablas users y credit_cards listas).');
      return pool.end();
    })
    .catch((err: unknown) => {
      console.error('Error al inicializar la base de datos:', err);
      process.exit(1);
    });
}

