import app from './app';
import { env } from './config/env';
import { initializeDatabase } from './db/init';

async function bootstrap(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('Esquema relacional PostgreSQL verificado.');
  } catch (error) {
    console.warn(
      'Advertencia: No se pudo inicializar automáticamente la BD al arrancar. Verifica que PostgreSQL esté corriendo.',
      error instanceof Error ? error.message : error
    );
  }

  app.listen(env.port, () => {
    console.log(`Servidor corriendo en http://localhost:${env.port}`);
    console.log(`Endpoints disponibles en http://localhost:${env.port}/api/v1/credit-cards`);
  });
}

void bootstrap();

