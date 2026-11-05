import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import creditCardRoutes from './routes/credit-card.routes';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', service: 'credit-cards-api' });
});

app.use('/api/v1/credit-cards', creditCardRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Ruta no encontrada.',
  });
});

export default app;

