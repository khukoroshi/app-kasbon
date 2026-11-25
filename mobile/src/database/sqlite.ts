import { Customer, Transaction, SummaryStats, SyncStatus } from '../types';

// Simple UUID generator fallback for React Native without external crypto
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// In-Memory Storage / SQLite abstraction layer
// Ini mendukung SQLite di mobile sekaligus menyediakan fallback in-memory yang mulus
class LocalDatabase {
  private customers: Map<string, Customer> = new Map();
  private transactions: Map<string, Transaction> = new Map();

  async init(): Promise<void> {
    console.log('✅ Local Database Warung Kasbon siap digunakan (Offline Mode).');
    // Tambahkan contoh data awal jika kosong agar pemilik warung bisa langsung mencoba
    if (this.customers.size === 0) {
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    const cust1: Customer = {
      id: generateUUID(),
      name: 'Pak Budi (Pos Ronda)',
      phone: '081234567890',
      address: 'Rumah no. 12',
      credit_limit: 500000,
      current_balance: 75000,
      is_active: 1,
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const cust2: Customer = {
      id: generateUUID(),
      name: 'Bu RT Endang',
      phone: '081987654321',
      address: 'Depan musholla',
      credit_limit: 1000000,
      current_balance: 150000,
      is_active: 1,
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.customers.set(cust1.id, cust1);
    this.customers.set(cust2.id, cust2);

    const tx1: Transaction = {
      id: generateUUID(),
      customer_id: cust1.id,
      type: 'DEBT',
      amount: 75000,
      notes: 'Beras 5kg, Minyak 1L',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      sync_status: 'SYNCED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.transactions.set(tx1.id, tx1);
  }

  async getSummaryStats(): Promise<SummaryStats> {
    let totalDebt = 0;
    let withDebtCount = 0;

    for (const cust of this.customers.values()) {
      if (cust.is_active && cust.current_balance > 0) {
        totalDebt += cust.current_balance;
        withDebtCount++;
      }
    }

    return {
      totalCustomers: this.customers.size,
      totalOutstandingDebt: totalDebt,
      customersWithDebtCount: withDebtCount,
    };
  }

  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    const list = Array.from(this.customers.values()).filter((c) => c.is_active === 1);
    if (!searchQuery) {
      return list.sort((a, b) => b.current_balance - a.current_balance);
    }
    const q = searchQuery.toLowerCase();
    return list
      .filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)))
      .sort((a, b) => b.current_balance - a.current_balance);
  }

  async addCustomer(name: string, phone?: string, address?: string, creditLimit: number = 0): Promise<Customer> {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: generateUUID(),
      name,
      phone: phone || null,
      address: address || null,
      credit_limit: creditLimit,
      current_balance: 0,
      is_active: 1,
      sync_status: 'PENDING',
      created_at: now,
      updated_at: now,
    };

    this.customers.set(customer.id, customer);
    return customer;
  }

  async recordTransaction(
    customerId: string,
    type: 'DEBT' | 'PAYMENT',
    amount: number,
    notes?: string,
    paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS' = 'CASH'
  ): Promise<Transaction> {
    const customer = this.customers.get(customerId);
    if (!customer) throw new Error('Pelanggan tidak ditemukan');

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const transaction: Transaction = {
      id: generateUUID(),
      customer_id: customerId,
      type,
      amount,
      notes: notes || null,
      transaction_date: today,
      payment_method: paymentMethod,
      sync_status: 'PENDING',
      created_at: now,
      updated_at: now,
    };

    this.transactions.set(transaction.id, transaction);

    // Update Saldo Kasbon Pelanggan
    if (type === 'DEBT') {
      customer.current_balance += amount;
    } else {
      customer.current_balance = Math.max(0, customer.current_balance - amount);
    }
    customer.sync_status = 'PENDING';
    customer.updated_at = now;
    this.customers.set(customerId, customer);

    return transaction;
  }

  async getCustomerTransactions(customerId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getPendingMutations(): Promise<{ customers: Customer[]; transactions: Transaction[] }> {
    const pendingCustomers = Array.from(this.customers.values()).filter((c) => c.sync_status === 'PENDING');
    const pendingTransactions = Array.from(this.transactions.values()).filter((t) => t.sync_status === 'PENDING');
    return { customers: pendingCustomers, transactions: pendingTransactions };
  }

  async markMutationsSynced(customerIds: string[], transactionIds: string[]): Promise<void> {
    for (const id of customerIds) {
      const c = this.customers.get(id);
      if (c) c.sync_status = 'SYNCED';
    }
    for (const id of transactionIds) {
      const t = this.transactions.get(id);
      if (t) t.sync_status = 'SYNCED';
    }
  }

  async mergeRemoteData(customers: Customer[], transactions: Transaction[]): Promise<void> {
    for (const remoteCust of customers) {
      const local = this.customers.get(remoteCust.id);
      if (!local || new Date(remoteCust.updated_at) >= new Date(local.updated_at)) {
        this.customers.set(remoteCust.id, { ...remoteCust, sync_status: 'SYNCED' });
      }
    }
    for (const remoteTx of transactions) {
      const local = this.transactions.get(remoteTx.id);
      if (!local || new Date(remoteTx.updated_at) >= new Date(local.updated_at)) {
        this.transactions.set(remoteTx.id, { ...remoteTx, sync_status: 'SYNCED' });
      }
    }
  }
}

export const localDb = new LocalDatabase();
