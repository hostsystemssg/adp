import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb } from '../../src/db/dbStore';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signJWT } from '../../src/lib/jwt';

// Initialize DB
VercelDb.ensureTables().catch(console.error);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Simple routing based on URL path
    // Vercel passes the rest of the path after /api/auth/
    const url = req.url || '';
    const path = url.replace(/^\/api\/auth\//, '').split('?')[0]; // Remove query params

    // LOGIN ROUTE: POST /api/auth/login
    if (path === 'login' && req.method === 'POST') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const users = await VercelDb.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user || user.isAnonymized) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = await signJWT({ id: user.id, email: user.email, role: user.role });
      
      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    }

    // REGISTER ROUTE: POST /api/auth/register
    if (path === 'register' && req.method === 'POST') {
       // Add registration logic here if needed
       return res.status(501).json({ error: 'Registration not implemented in this snippet' });
    }

    // ME ROUTE: GET /api/auth/me
    if (path === 'me' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Verify token logic would go here
      return res.status(200).json({ message: 'Auth working', path: 'me' });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
