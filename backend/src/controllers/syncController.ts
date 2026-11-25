import { Request, Response } from 'express';
import { syncService } from '../services/syncService.js';
import { SyncPushPayload } from '../types/index.js';

export const pushSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload: SyncPushPayload = req.body;
    if (!payload) {
      res.status(400).json({ error: 'Payload tidak valid' });
      return;
    }

    const result = await syncService.handlePush(payload);
    res.json(result);
  } catch (error: any) {
    console.error('Error saat push sync:', error);
    res.status(500).json({ error: error.message || 'Gagal melakukan sinkronisasi push' });
  }
};

export const pullSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const since = req.query.since as string | undefined;
    const result = await syncService.handlePull(since);
    res.json(result);
  } catch (error: any) {
    console.error('Error saat pull sync:', error);
    res.status(500).json({ error: error.message || 'Gagal melakukan sinkronisasi pull' });
  }
};
