import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app';
import { creditCardRepository } from '../src/repositories/credit-card.repository';
import { CreditCardDTO, CreditCardStatus } from '../src/types/credit-card.types';

describe('API Financiera: Tarjetas de Crédito (/api/v1/credit-cards)', () => {
  let server: http.Server;
  let baseUrl = '';

  // Estado simulado de BD para probar los 5 endpoints HTTP y sus códigos de estado
  const mockStore = new Map<number, CreditCardDTO>([
    [
      1,
      {
        id: 1,
        userId: 1,
        cardNumber: '4532-8910-2234-5678',
        creditLimit: 15000,
        limit: 15000,
        balance: 1200.5,
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ],
  ]);
  let nextId = 2;

  before(async () => {
    creditCardRepository.findAllActive = async (): Promise<CreditCardDTO[]> =>
      [...mockStore.values()].filter(
        (c) => c.isActive && c.deletedAt === null && c.status === 'ACTIVE'
      );

    creditCardRepository.findById = async (id: number): Promise<CreditCardDTO | null> => {
      const card = mockStore.get(id);
      return card && card.deletedAt === null ? card : null;
    };

    creditCardRepository.create = async (params: {
      userId: number;
      creditLimit: number;
      cardNumber?: string;
    }): Promise<CreditCardDTO> => {
      const id = nextId++;
      const now = new Date().toISOString();
      const created: CreditCardDTO = {
        id,
        userId: params.userId,
        cardNumber: params.cardNumber ?? `4532-0000-0000-${String(id).padStart(4, '0')}`,
        creditLimit: params.creditLimit,
        limit: params.creditLimit,
        balance: 0,
        status: 'ACTIVE',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      mockStore.set(id, created);
      return created;
    };

    creditCardRepository.update = async (
      id: number,
      fields: { creditLimit?: number; status?: CreditCardStatus }
    ): Promise<CreditCardDTO | null> => {
      const card = mockStore.get(id);
      if (!card || card.deletedAt !== null) return null;
      if (fields.creditLimit !== undefined) {
        card.creditLimit = fields.creditLimit;
        card.limit = fields.creditLimit;
      }
      if (fields.status !== undefined) {
        card.status = fields.status;
        card.isActive = fields.status === 'ACTIVE';
      }
      card.updatedAt = new Date().toISOString();
      return card;
    };

    creditCardRepository.softDelete = async (id: number): Promise<boolean> => {
      const card = mockStore.get(id);
      if (!card || card.deletedAt !== null) return false;
      card.isActive = false;
      card.status = 'INACTIVE';
      card.deletedAt = new Date().toISOString();
      return true;
    };

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET /api/v1/credit-cards -> Retorna 200 OK con array JSON de tarjetas activas', async () => {
    const res = await fetch(`${baseUrl}/api/v1/credit-cards`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as CreditCardDTO[];
    assert.equal(Array.isArray(body), true);
    assert.equal(body.length, 1);
    assert.equal(body[0]?.id, 1);
  });

  it('POST /api/v1/credit-cards -> Falla con 400 si falta limit o userId y retorna 201 Created cuando están presentes', async () => {
    const badRes = await fetch(`${baseUrl}/api/v1/credit-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1 }),
    });
    assert.equal(badRes.status, 400);

    const createRes = await fetch(`${baseUrl}/api/v1/credit-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, limit: 8500 }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as CreditCardDTO;
    assert.equal(created.id, 2);
    assert.equal(created.creditLimit, 8500);
  });

  it('GET /api/v1/credit-cards/:id -> Retorna 200 OK o 404 Not Found si no existe', async () => {
    const okRes = await fetch(`${baseUrl}/api/v1/credit-cards/1`);
    assert.equal(okRes.status, 200);

    const notFoundRes = await fetch(`${baseUrl}/api/v1/credit-cards/999`);
    assert.equal(notFoundRes.status, 404);
  });

  it('PATCH /api/v1/credit-cards/:id -> Actualiza creditLimit o status y retorna 200 OK', async () => {
    const patchRes = await fetch(`${baseUrl}/api/v1/credit-cards/2`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creditLimit: 12000, status: 'ACTIVE' }),
    });
    assert.equal(patchRes.status, 200);
    const updated = (await patchRes.json()) as CreditCardDTO;
    assert.equal(updated.creditLimit, 12000);
  });

  it('DELETE /api/v1/credit-cards/:id -> Eliminación lógica (soft delete) y retorna 204 No Content', async () => {
    const delRes = await fetch(`${baseUrl}/api/v1/credit-cards/2`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 204);

    // Ya no debe aparecer como existente ni en la lista de activas
    const getDeleted = await fetch(`${baseUrl}/api/v1/credit-cards/2`);
    assert.equal(getDeleted.status, 404);
  });
});

