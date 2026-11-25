import { run, query } from '../config/database.js';
import { Customer, Transaction, SyncPushPayload, SyncPushResponse, SyncPullResponse } from '../types/index.js';

export class SyncService {
  /**
   * Menerima mutasi data yang di-push oleh perangkat HP (offline -> online)
   */
  async handlePush(payload: SyncPushPayload): Promise<SyncPushResponse> {
    const syncedCustomerIds: string[] = [];
    const syncedTransactionIds: string[] = [];
    const affectedCustomerIds = new Set<string>();

    const now = new Date().toISOString();

    // 1. Upsert Pelanggan
    if (payload.customers && payload.customers.length > 0) {
      for (const cust of payload.customers) {
        await run(
          `
          INSERT INTO customers (id, name, phone, address, credit_limit, current_balance, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            phone = excluded.phone,
            address = excluded.address,
            credit_limit = excluded.credit_limit,
            is_active = excluded.is_active,
            updated_at = excluded.updated_at
          WHERE excluded.updated_at >= customers.updated_at;
        `,
          [
            cust.id,
            cust.name,
            cust.phone || null,
            cust.address || null,
            cust.credit_limit || 0,
            cust.current_balance || 0,
            cust.is_active ?? 1,
            cust.created_at || now,
            cust.updated_at || now,
          ]
        );
        syncedCustomerIds.push(cust.id);
        affectedCustomerIds.add(cust.id);
      }
    }

    // 2. Upsert Transaksi Kasbon & Pembayaran
    if (payload.transactions && payload.transactions.length > 0) {
      for (const tx of payload.transactions) {
        await run(
          `
          INSERT INTO transactions (id, customer_id, type, amount, notes, transaction_date, payment_method, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            notes = excluded.notes,
            amount = excluded.amount,
            updated_at = excluded.updated_at
          WHERE excluded.updated_at >= transactions.updated_at;
        `,
          [
            tx.id,
            tx.customer_id,
            tx.type,
            tx.amount,
            tx.notes || null,
            tx.transaction_date,
            tx.payment_method || 'CASH',
            tx.created_at || now,
            tx.updated_at || now,
          ]
        );
        syncedTransactionIds.push(tx.id);
        affectedCustomerIds.add(tx.customer_id);
      }
    }

    // 3. Rekalkulasi Saldo Pelanggan untuk menjamin integritas buku besar (Ledger)
    for (const custId of affectedCustomerIds) {
      const rows = await query<{ balance: number }>(
        `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'DEBT' THEN amount ELSE -amount END), 0) as balance
        FROM transactions
        WHERE customer_id = ?
      `,
        [custId]
      );

      const computedBalance = rows[0]?.balance ?? 0;
      await run(
        `UPDATE customers SET current_balance = ?, updated_at = ? WHERE id = ?`,
        [computedBalance, now, custId]
      );
    }

    return {
      success: true,
      synced_customer_ids: syncedCustomerIds,
      synced_transaction_ids: syncedTransactionIds,
      timestamp: now,
    };
  }

  /**
   * Mengirim data perubahan terbaru dari server ke HP
   */
  async handlePull(since?: string): Promise<SyncPullResponse> {
    const serverTimestamp = new Date().toISOString();

    let customers: Customer[];
    let transactions: Transaction[];

    if (since) {
      customers = await query<Customer>(
        `SELECT * FROM customers WHERE updated_at > ? ORDER BY updated_at ASC`,
        [since]
      );
      transactions = await query<Transaction>(
        `SELECT * FROM transactions WHERE updated_at > ? ORDER BY updated_at ASC`,
        [since]
      );
    } else {
      customers = await query<Customer>(`SELECT * FROM customers ORDER BY name ASC`);
      transactions = await query<Transaction>(`SELECT * FROM transactions ORDER BY created_at DESC`);
    }

    return {
      success: true,
      customers,
      transactions,
      server_timestamp: serverTimestamp,
    };
  }
}

export const syncService = new SyncService();
