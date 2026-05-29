import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb } from '../../src/db/dbStore';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Ensure DB tables exist (non-blocking)
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
    // Determine action from URL path
    // Vercel strips /api/auth/ so url might be just ?action=login or empty
    const urlPath = req.url || '';
    const cleanPath = urlPath.replace(/^\//, '').split('?')[0];
    
    // Handle Login
    if (req.method === 'POST' && (cleanPath === 'login' || cleanPath === '')) {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Initialize DB explicitly before query
      await VercelDb.ensureTables();
      const users = await VercelDb.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.isAnonymized) {
        return res.status(403).json({ error: 'Account has been anonymized' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
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

    // Handle Register
    if (req.method === 'POST' && cleanPath === 'register') {
      const { email, password, fullName, phone } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await VercelDb.ensureTables();
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
        phone: phone || '',
        role: 'retailer' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnonymized: false
      };

      await VercelDb.saveUser(newUser);

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET || 'fallback-secret',
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

    // Handle Get Me (Protected)
    if (req.method === 'GET' && (cleanPath === 'me' || cleanPath === '')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      let payload: any;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      await VercelDb.ensureTables();
      const users = await VercelDb.getUsers();
      const user = users.find(u => u.id === payload.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
