export type TransactionType = 'DEBT' | 'PAYMENT';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface Customer {
  id: string; // UUID
  name: string;
  phone?: string | null;
  address?: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string; // UUID
  customer_id: string;
  type: TransactionType;
  amount: number;
  notes?: string | null;
  transaction_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface SummaryStats {
  totalCustomers: number;
  totalOutstandingDebt: number;
  customersWithDebtCount: number;
}
