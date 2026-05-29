import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// --- INLINE DB HELPERS TO AVOID PATH ISSUES ---
async function ensureTables() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT CHECK (role IN ('retailer', 'admin')) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      is_anonymized BOOLEAN DEFAULT FALSE
    )`;
    
    // Seed Admin if empty
    const { rows } = await sql`SELECT COUNT(*) as count FROM users`;
    if (Number(rows[0].count) === 0) {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash('hostsystems2018!', salt);
      await sql`INSERT INTO users (id, email, password_hash, full_name, phone, role) 
                VALUES ('admin-user-id', 'andrew.lim@hostsystems.sg', ${hash}, 'Andrew Lim (Master Admin)', '+65 6717 6511', 'admin')`;
    }
  } catch (e) {
    console.error('DB Init Error:', e);
  }
}

async function getUserByEmail(email: string) {
  try {
    const { rows } = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      passwordHash: r.password_hash,
      fullName: r.full_name,
      phone: r.phone,
      role: r.role as 'admin' | 'retailer',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      isAnonymized: r.is_anonymized
    };
  } catch (e) {
    console.error('Get User Error:', e);
    return null;
  }
}

async function saveUser(user: any) {
  await sql`INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at, is_anonymized)
            VALUES (${user.id}, ${user.email}, ${user.passwordHash}, ${user.fullName}, ${user.phone}, ${user.role}, NOW(), NOW(), ${user.isAnonymized})
            ON CONFLICT (id) DO UPDATE SET 
            email = ${user.email}, full_name = ${user.fullName}, phone = ${user.phone}, role = ${user.role}, updated_at = NOW()`;
  return user;
}

// --- API HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensureTables();
    const urlPath = (req.url || '').replace(/^\//, '').split('?')[0];

    // LOGIN
    if (req.method === 'POST' && (urlPath === 'login' || urlPath === '')) {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const user = await getUserByEmail(email);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      if (user.isAnonymized) return res.status(403).json({ error: 'Account anonymized' });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
      });
    }

    // REGISTER
    if (req.method === 'POST' && urlPath === 'register') {
      const { email, password, fullName, phone } = req.body;
      if (!email || !password || !fullName) return res.status(400).json({ error: 'Missing fields' });

      const existing = await getUserByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email exists' });

      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        passwordHash: hash,
        fullName,
        phone: phone || '',
        role: 'retailer' as const,
        isAnonymized: false
      };

      await saveUser(newUser);
      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });

      return res.status(201).json({
        token,
        user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role }
      });
    }

    // GET ME
    if (req.method === 'GET' && (urlPath === 'me' || urlPath === '')) {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const payload: any = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback-secret');
        const user = await getUserByEmail(payload.email); // Fetch fresh data
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        return res.status(200).json({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        });
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth Crash:', error);
    return res.status(500).json({ error: 'Server Error', details: error.message });
  }
}
