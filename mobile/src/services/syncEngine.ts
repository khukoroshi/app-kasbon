import { localDb } from '../database/sqlite';

export interface SyncResult {
  success: boolean;
  message: string;
  pushedCount?: number;
  pulledCount?: number;
}

export class SyncEngine {
  private serverUrl: string = 'http://10.0.2.2:5000'; // Default emulator android address ke localhost
  private isSyncing: boolean = false;

  setServerUrl(url: string) {
    this.serverUrl = url;
  }

  async runSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, message: 'Sinkronisasi sedang berlangsung...' };
    }

    this.isSyncing = true;
    try {
      // 1. Ambil data lokal yang masih berstatus PENDING
      const { customers, transactions } = await localDb.getPendingMutations();

      let pushedCustomers = 0;
      let pushedTransactions = 0;

      // 2. Push ke Server jika ada mutasi tertunda
      if (customers.length > 0 || transactions.length > 0) {
        const pushRes = await fetch(`${this.serverUrl}/api/v1/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customers, transactions }),
        });

        if (pushRes.ok) {
          const pushData = await pushRes.json();
          await localDb.markMutationsSynced(
            pushData.synced_customer_ids || [],
            pushData.synced_transaction_ids || []
          );
          pushedCustomers = (pushData.synced_customer_ids || []).length;
          pushedTransactions = (pushData.synced_transaction_ids || []).length;
        }
      }

      // 3. Pull data terbaru dari Server
      const pullRes = await fetch(`${this.serverUrl}/api/v1/sync/pull`);
      if (pullRes.ok) {
        const pullData = await pullRes.json();
        if (pullData.customers || pullData.transactions) {
          await localDb.mergeRemoteData(pullData.customers || [], pullData.transactions || []);
        }
      }

      this.isSyncing = false;
      return {
        success: true,
        message: 'Sinkronisasi berhasil!',
        pushedCount: pushedCustomers + pushedTransactions,
      };
    } catch (error: any) {
      this.isSyncing = false;
      return {
        success: false,
        message: `Offline mode: Server tidak terjangkau (${error.message || 'Network error'}). Data aman tersimpan lokal di HP.`,
      };
    }
  }
}

export const syncEngine = new SyncEngine();
