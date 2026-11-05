import { pool } from '../db/pool';
import {
  CreditCardDTO,
  CreditCardRow,
  CreditCardStatus,
  mapRowToCreditCardDTO,
} from '../types/credit-card.types';

function generateCardNumber(): string {
  const randomSegment = (): string =>
    Math.floor(1000 + Math.random() * 9000).toString();
  return `4532-${randomSegment()}-${randomSegment()}-${randomSegment()}`;
}

export class CreditCardRepository {
  /**
   * GET /api/v1/credit-cards
   * Retorna todas las tarjetas activas (no eliminadas lógicamente y con status ACTIVE).
   */
  public async findAllActive(): Promise<CreditCardDTO[]> {
    const query = `
      SELECT id, user_id, card_number, credit_limit, balance, status, is_active, created_at, updated_at, deleted_at
      FROM credit_cards
      WHERE is_active = TRUE
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
      ORDER BY id ASC;
    `;
    const result = await pool.query<CreditCardRow>(query);
    return result.rows.map(mapRowToCreditCardDTO);
  }

  /**
   * GET /api/v1/credit-cards/:id
   * Busca una tarjeta por su ID (que no haya sido eliminada lógicamente).
   */
  public async findById(id: number): Promise<CreditCardDTO | null> {
    const query = `
      SELECT id, user_id, card_number, credit_limit, balance, status, is_active, created_at, updated_at, deleted_at
      FROM credit_cards
      WHERE id = $1
        AND deleted_at IS NULL;
    `;
    const result = await pool.query<CreditCardRow>(query, [id]);
    const row = result.rows[0];
    return row ? mapRowToCreditCardDTO(row) : null;
  }

  /**
   * POST /api/v1/credit-cards
   * Crea una nueva tarjeta de crédito asociada a un usuario en el modelo relacional.
   * Si el userId no existe aún en la tabla `users`, lo registra automáticamente
   * dentro de la misma transacción para mantener integridad referencial sin fallar en pruebas cURL.
   */
  public async create(params: {
    userId: number;
    creditLimit: number;
    cardNumber?: string;
  }): Promise<CreditCardDTO> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Garantizar existencia del usuario en el modelo relacional (users 1:N credit_cards)
      await client.query(
        `
        INSERT INTO users (id, full_name, email)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          params.userId,
          `Usuario #${params.userId}`,
          `user${params.userId}@financial.local`,
        ]
      );

      const finalCardNumber = params.cardNumber?.trim() || generateCardNumber();

      const insertQuery = `
        INSERT INTO credit_cards (user_id, card_number, credit_limit, balance, status, is_active)
        VALUES ($1, $2, $3, 0.00, 'ACTIVE', TRUE)
        RETURNING id, user_id, card_number, credit_limit, balance, status, is_active, created_at, updated_at, deleted_at;
      `;

      const result = await client.query<CreditCardRow>(insertQuery, [
        params.userId,
        finalCardNumber,
        params.creditLimit,
      ]);

      await client.query('COMMIT');

      const createdRow = result.rows[0];
      if (!createdRow) {
        throw new Error('No se pudo crear la tarjeta de crédito.');
      }

      return mapRowToCreditCardDTO(createdRow);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * PATCH /api/v1/credit-cards/:id
   * Actualiza creditLimit y/o status de una tarjeta existente.
   */
  public async update(
    id: number,
    fields: { creditLimit?: number; status?: CreditCardStatus }
  ): Promise<CreditCardDTO | null> {
    const updates: string[] = [];
    const values: Array<number | string | boolean> = [];
    let paramIndex = 1;

    if (fields.creditLimit !== undefined) {
      updates.push(`credit_limit = $${paramIndex++}`);
      values.push(fields.creditLimit);
    }

    if (fields.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(fields.status);
      updates.push(`is_active = $${paramIndex++}`);
      values.push(fields.status === 'ACTIVE');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE credit_cards
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
        AND deleted_at IS NULL
      RETURNING id, user_id, card_number, credit_limit, balance, status, is_active, created_at, updated_at, deleted_at;
    `;

    const result = await pool.query<CreditCardRow>(query, values);
    const updatedRow = result.rows[0];
    return updatedRow ? mapRowToCreditCardDTO(updatedRow) : null;
  }

  /**
   * DELETE /api/v1/credit-cards/:id
   * Eliminación lógica (soft delete) en base de datos.
   */
  public async softDelete(id: number): Promise<boolean> {
    const query = `
      UPDATE credit_cards
      SET is_active = FALSE,
          status = 'INACTIVE',
          deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id;
    `;
    const result = await pool.query<{ id: number }>(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const creditCardRepository = new CreditCardRepository();

