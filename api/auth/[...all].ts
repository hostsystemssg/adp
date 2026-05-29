import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT } from '../../src/lib/jwt';
import { VercelDb } from '../../src/db/dbStore';
import { z } from 'zod';

// --- SAFE DATABASE INITIALIZATION ---
// We do NOT await this here to prevent blocking the request if DB is slow/unavailable initially.
// The individual functions will call ensureTables() themselves if needed.
VercelDb.ensureTables().catch((err) => {
  console.error('⚠️ Background DB Initialization Failed:', err);
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ... [Rest of your existing login logic] ...
    // Ensure you call await VercelDb.ensureTables() INSIDE your login block before querying users
