import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb } from '../../src/db/dbStore';
import { signJWT, verifyJWT } from '../../src/lib/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Initialize DB tables on cold start
VercelDb.ensureTables().catch(console.error);

// Schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().min(8),
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
    const urlPath = req.url || '';
    const cleanPath = urlPath.replace(/^\//, '').split('?')[0];
    
    // --- LOGIN ---
    if (req.method === 'POST' && cleanPath === 'login') {
      const body = req.body;
      
      // Validate input
      const validation = loginSchema.safeParse(body);
      if (!validation.success) {
        // Fix for Zod v4: use .flatten() or access .issues directly
        const errorMsg = validation.error.issues.map(i => i.message).join(', ');
        return res.status(400).json({ error: errorMsg });
      }

      const { email, password } = validation.data;

      // Find user
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

      // Generate Token (Cast user object to match expected payload structure if needed)
      const token = await signJWT({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      } as any);

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
        const errorMsg = validation.error.issues.map(i => i.message).join(', ');
        return res.status(400).json({ error: errorMsg });
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
        isAnonymized: false,
      };

      await VercelDb.saveUser(newUser);

      const token = await signJWT({ 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      } as any);

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

    // --- GET ME (Protected) ---
    if (req.method === 'GET' && cleanPath === 'me') {
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

      if (!user || user.isAnonymized) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      });
    }

    // --- GET MY DATA (PDPA) ---
    if (req.method === 'GET' && cleanPath === 'my-data') {
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
      
      if (!user) return res.status(404).json({ error: 'User not found' });

      const retailers = await VercelDb.getRetailers();
      const retailer = retailers.find(r => r.userId === user.id);
      
      const orders = await VercelDb.getOrders();
      const userOrders = orders.filter(o => o.userId === user.id);

      return res.status(200).json({
        user: { ...user, passwordHash: undefined },
        retailer,
        orders: userOrders
      });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
