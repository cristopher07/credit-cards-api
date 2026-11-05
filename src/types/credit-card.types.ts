export const VALID_CARD_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'BLOCKED',
  'FROZEN',
  'CANCELLED',
] as const;

export type CreditCardStatus = (typeof VALID_CARD_STATUSES)[number];

export interface CreditCardRow {
  id: number;
  user_id: number;
  card_number: string;
  credit_limit: string;
  balance: string;
  status: CreditCardStatus;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreditCardDTO {
  id: number;
  userId: number;
  cardNumber: string;
  creditLimit: number;
  limit: number;
  balance: number;
  status: CreditCardStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCreditCardRequest {
  userId?: number;
  limit?: number;
  creditLimit?: number;
  cardNumber?: string;
}

export interface UpdateCreditCardRequest {
  creditLimit?: number;
  limit?: number;
  status?: CreditCardStatus;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export function isValidCardStatus(value: unknown): value is CreditCardStatus {
  return (
    typeof value === 'string' &&
    (VALID_CARD_STATUSES as readonly string[]).includes(value.toUpperCase())
  );
}

export function mapRowToCreditCardDTO(row: CreditCardRow): CreditCardDTO {
  const numericLimit = Number(row.credit_limit);
  return {
    id: row.id,
    userId: row.user_id,
    cardNumber: row.card_number,
    creditLimit: numericLimit,
    limit: numericLimit,
    balance: Number(row.balance),
    status: row.status,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
  };
}

