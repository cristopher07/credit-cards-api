import { Router } from 'express';
import { creditCardController } from '../controllers/credit-card.controller';

const router = Router();

// GET /api/v1/credit-cards -> Retorna 200 OK con array JSON de tarjetas activas
router.get('/', creditCardController.getAllActive);

// POST /api/v1/credit-cards -> Retorna 201 Created. Falla con 400 si falta limit o userId
router.post('/', creditCardController.create);

// GET /api/v1/credit-cards/:id -> Retorna 200 OK o 404 Not Found si no existe en BD
router.get('/:id', creditCardController.getById);

// PATCH /api/v1/credit-cards/:id -> Actualiza creditLimit o status. Retorna 200 OK
router.patch('/:id', creditCardController.update);

// DELETE /api/v1/credit-cards/:id -> Eliminación lógica (soft delete) en BD. Retorna 204 No Content
router.delete('/:id', creditCardController.softDelete);

export default router;

