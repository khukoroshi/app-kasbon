import { Request, Response } from 'express';
import { query } from '../config/database.js';
import { Customer } from '../types/index.js';

export const getDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const summary = await query<{
      total_customers: number;
      total_outstanding_debt: number;
      total_transactions: number;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM customers WHERE is_active = 1) as total_customers,
        (SELECT COALESCE(SUM(current_balance), 0) FROM customers WHERE is_active = 1 AND current_balance > 0) as total_outstanding_debt,
        (SELECT COUNT(*) FROM transactions) as total_transactions
    `);

    const topDebtors = await query<Customer>(`
      SELECT id, name, phone, current_balance, updated_at 
      FROM customers 
      WHERE current_balance > 0 
      ORDER BY current_balance DESC 
      LIMIT 10
    `);

    res.json({
      summary: summary[0],
      top_debtors: topDebtors,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal memuat ringkasan dashboard' });
  }
};
