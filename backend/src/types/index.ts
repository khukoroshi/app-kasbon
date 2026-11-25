export type TransactionType = 'DEBT' | 'PAYMENT';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS';

export interface Customer {
  id: string; // UUIDv4
  name: string;
  phone?: string | null;
  address?: string | null;
  credit_limit?: number;
  current_balance: number;
  is_active: number; // 1 = active, 0 = inactive
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string; // UUIDv4
  customer_id: string;
  type: TransactionType;
  amount: number;
  notes?: string | null;
  transaction_date: string; // YYYY-MM-DD
  payment_method?: PaymentMethod | null;
  created_at: string;
  updated_at: string;
}

export interface SyncPushPayload {
  customers: Customer[];
  transactions: Transaction[];
}

export interface SyncPushResponse {
  success: boolean;
  synced_customer_ids: string[];
  synced_transaction_ids: string[];
  timestamp: string;
}

export interface SyncPullResponse {
  success: boolean;
  customers: Customer[];
  transactions: Transaction[];
  server_timestamp: string;
}
