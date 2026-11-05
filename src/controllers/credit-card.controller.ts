import { Request, Response } from 'express';
import { creditCardRepository } from '../repositories/credit-card.repository';
import {
  ApiErrorResponse,
  CreateCreditCardRequest,
  CreditCardDTO,
  CreditCardStatus,
  UpdateCreditCardRequest,
  VALID_CARD_STATUSES,
  isValidCardStatus,
} from '../types/credit-card.types';

export class CreditCardController {
  /**
   * GET /api/v1/credit-cards
   * Retorna 200 OK con array JSON de tarjetas activas.
   */
  public getAllActive = async (
    _req: Request,
    res: Response<CreditCardDTO[] | ApiErrorResponse>
  ): Promise<void> => {
    try {
      const cards = await creditCardRepository.findAllActive();
      res.status(200).json(cards);
    } catch (error) {
      console.error('Error en GET /api/v1/credit-cards:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al consultar las tarjetas de crédito activas.',
      });
    }
  };

  /**
   * GET /api/v1/credit-cards/:id
   * Retorna 200 OK o 404 Not Found si no existe en BD.
   */
  public getById = async (
    req: Request<{ id: string }>,
    res: Response<CreditCardDTO | ApiErrorResponse>
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'El parámetro id debe ser un número entero positivo.',
        });
        return;
      }

      const card = await creditCardRepository.findById(id);
      if (!card) {
        res.status(404).json({
          error: 'Not Found',
          message: `No se encontró la tarjeta de crédito con id ${id}.`,
        });
        return;
      }

      res.status(200).json(card);
    } catch (error) {
      console.error('Error en GET /api/v1/credit-cards/:id:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al obtener la tarjeta de crédito.',
      });
    }
  };

  /**
   * POST /api/v1/credit-cards
   * Retorna 201 Created. Falla con 400 si falta limit (o creditLimit) o userId.
   */
  public create = async (
    req: Request<Record<string, never>, CreditCardDTO | ApiErrorResponse, CreateCreditCardRequest>,
    res: Response<CreditCardDTO | ApiErrorResponse>
  ): Promise<void> => {
    try {
      const { userId, limit, creditLimit, cardNumber } = req.body ?? {};
      const resolvedLimit = limit ?? creditLimit;

      if (userId === undefined || userId === null || resolvedLimit === undefined || resolvedLimit === null) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Los campos "userId" y "limit" (o "creditLimit") son obligatorios.',
        });
        return;
      }

      const parsedUserId = Number(userId);
      const parsedLimit = Number(resolvedLimit);

      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'El campo "userId" debe ser un número entero positivo.',
        });
        return;
      }

      if (Number.isNaN(parsedLimit) || parsedLimit < 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'El campo "limit" debe ser un monto numérico mayor o igual a 0.',
        });
        return;
      }

      const createdCard = await creditCardRepository.create({
        userId: parsedUserId,
        creditLimit: parsedLimit,
        cardNumber,
      });

      res.status(201).json(createdCard);
    } catch (error) {
      console.error('Error en POST /api/v1/credit-cards:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al crear la tarjeta de crédito.',
      });
    }
  };

  /**
   * PATCH /api/v1/credit-cards/:id
   * Actualiza creditLimit o status. Retorna 200 OK.
   */
  public update = async (
    req: Request<{ id: string }, CreditCardDTO | ApiErrorResponse, UpdateCreditCardRequest>,
    res: Response<CreditCardDTO | ApiErrorResponse>
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'El parámetro id debe ser un número entero positivo.',
        });
        return;
      }

      const { creditLimit, limit, status } = req.body ?? {};
      const resolvedLimit = creditLimit ?? limit;

      if (resolvedLimit === undefined && status === undefined) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Debe proporcionar al menos "creditLimit" o "status" para actualizar.',
        });
        return;
      }

      const updateFields: { creditLimit?: number; status?: CreditCardStatus } = {};

      if (resolvedLimit !== undefined) {
        const parsedLimit = Number(resolvedLimit);
        if (Number.isNaN(parsedLimit) || parsedLimit < 0) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'El campo "creditLimit" debe ser un número mayor o igual a 0.',
          });
          return;
        }
        updateFields.creditLimit = parsedLimit;
      }

      if (status !== undefined) {
        const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status;
        if (!isValidCardStatus(normalizedStatus)) {
          res.status(400).json({
            error: 'Bad Request',
            message: `El campo "status" debe ser uno de: ${VALID_CARD_STATUSES.join(', ')}.`,
          });
          return;
        }
        updateFields.status = normalizedStatus;
      }

      const updatedCard = await creditCardRepository.update(id, updateFields);
      if (!updatedCard) {
        res.status(404).json({
          error: 'Not Found',
          message: `No se encontró la tarjeta de crédito con id ${id}.`,
        });
        return;
      }

      res.status(200).json(updatedCard);
    } catch (error) {
      console.error('Error en PATCH /api/v1/credit-cards/:id:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al actualizar la tarjeta de crédito.',
      });
    }
  };

  /**
   * DELETE /api/v1/credit-cards/:id
   * Eliminación lógica (soft delete) en base de datos. Retorna 204 No Content.
   */
  public softDelete = async (
    req: Request<{ id: string }>,
    res: Response<ApiErrorResponse | void>
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'El parámetro id debe ser un número entero positivo.',
        });
        return;
      }

      const deleted = await creditCardRepository.softDelete(id);
      if (!deleted) {
        res.status(404).json({
          error: 'Not Found',
          message: `No se encontró la tarjeta de crédito activa con id ${id}.`,
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error en DELETE /api/v1/credit-cards/:id:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al eliminar lógicamente la tarjeta de crédito.',
      });
    }
  };
}

export const creditCardController = new CreditCardController();

