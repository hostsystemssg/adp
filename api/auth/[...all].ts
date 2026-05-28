import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sign, verify } from 'jsonwebtoken';
import { VercelDb } from '../../src/db/dbStore';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Initialize DB tables on cold start
VercelDb.ensureTables().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

// Schema for login validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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
    // Determine action based on path or method
    // Path: /api/auth/login -> segments: ['login']
    const pathSegments = (req.url || '').replace(/^\/api\/auth\//, '').split('/').filter(Boolean);
    const action = pathSegments[0] || 'login'; 

    if (req.method === 'POST' && action === 'login') {
      const body = req.body;
      
      // Validate input
      const validation = loginSchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid email or password format' });
      }

      const { email, password } = validation.data;

      // Fetch users from DB
      const users = await VercelDb.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user || user.isAnonymized) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate Token
      // Fix: Explicitly define payload to satisfy TS
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      };

      const token = sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

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

    if (req.method === 'POST' && action === 'register') {
       // Placeholder for register logic if needed in this file
       return res.status(501).json({ error: 'Registration handled separately or not implemented in this block' });
    }

    if (req.method === 'GET' && action === 'me') {
      // Basic auth check for /me
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verify(token, JWT_SECRET) as any;
        return res.status(200).json({ user: decoded });
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
