import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT } from '../../src/lib/jwt';
import { VercelDb } from '../../src/db/dbStore';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize DB tables safely
    await VercelDb.ensureTables().catch((err) => {
      console.error('DB Initialization Warning:', err);
    });

    const urlPath = req.url || '';
    const cleanPath = urlPath.replace(/^\//, '').split('?')[0];
    const parts = cleanPath.split('/');
    
    // Handle /api/auth/login
    if (req.method === 'POST' && parts[0] === 'login') {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1)
      });

      let body;
      try {
        body = req.body;
        if (!body) throw new Error('Missing request body');
        loginSchema.parse(body);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ 
            error: 'Invalid input', 
            details: err.issues.map(i => i.message) 
          });
        }
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { email, password } = body;

      // Fetch users
      const users = await VercelDb.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const jwt = await import('jsonwebtoken');
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
      );

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

    // Handle /api/auth/register
    if (req.method === 'POST' && parts[0] === 'register') {
      const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
        phone: z.string().min(1)
      });

      let body;
      try {
        body = req.body;
        if (!body) throw new Error('Missing request body');
        registerSchema.parse(body);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ 
            error: 'Invalid input', 
            details: err.issues.map(i => i.message) 
          });
        }
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { email, password, fullName, phone } = body;

      const users = await VercelDb.getUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = {
        id: `user-${Date.now()}`,
        email,
        passwordHash,
        fullName,
        phone,
        role: 'retailer' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnonymized: false
      };

      await VercelDb.saveUser(newUser);

      const jwt = await import('jsonwebtoken');
      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email, 
          role: newUser.role 
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role
        }
      });
    }

    // Handle /api/auth/me (GET current user)
    if (req.method === 'GET' && parts[0] === 'me') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      
      let payload: any;
      try {
        payload = await verifyJWT(token);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const users = await VercelDb.getUsers();
      const user = users.find(u => u.id === payload.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
