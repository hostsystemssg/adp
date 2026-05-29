import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb } from '../../src/db/dbStore';
import { signJWT, verifyJWT } from '../../src/lib/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Initialize DB tables on cold start
VercelDb.ensureTables().catch(console.error);

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phone: z.string().min(1)
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
    // Determine action from URL path
    const urlPath = req.url || '';
    const cleanPath = urlPath.replace(/^\//, '').split('?')[0];
    
    // --- LOGIN ---
    if (req.method === 'POST' && cleanPath === 'login') {
      const body = req.body;
      const validation = loginSchema.safeParse(body);
      
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
      }

      const { email, password } = validation.data;
      const users = await VercelDb.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user || user.isAnonymized) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
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

    // --- REGISTER ---
    if (req.method === 'POST' && cleanPath === 'register') {
      const body = req.body;
      const validation = registerSchema.safeParse(body);
      
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
      }

      const { email, password, fullName, phone } = validation.data;
      const users = await VercelDb.getUsers();
      
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = `user-${Date.now()}`;

      const newUser = {
        id: userId,
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
      const token = await signJWT({ id: userId, email, role: 'retailer' });

      return res.status(201).json({
        token,
        user: {
          id: userId,
          email,
          fullName,
          role: 'retailer'
        }
      });
    }

    // --- GET CURRENT USER ---
    if (req.method === 'GET' && cleanPath === 'me') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      let payload;
      try {
        payload = await verifyJWT(token);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const users = await VercelDb.getUsers();
      const user = users.find(u => u.id === (payload as any).id);

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

    // --- GET MY DATA (PDPA) ---
    if (req.method === 'GET' && cleanPath === 'my-data') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      let payload;
      try {
        payload = await verifyJWT(token);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userId = (payload as any).id;
      const users = await VercelDb.getUsers();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const retailers = await VercelDb.getRetailers();
      const retailer = retailers.find(r => r.userId === userId);
      
      const orders = await VercelDb.getOrders();
      const userOrders = orders.filter(o => o.userId === userId);

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt
        },
        retailer: retailer || null,
        orders: userOrders
      });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
