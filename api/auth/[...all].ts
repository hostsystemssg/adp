import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- INLINE DATABASE HELPERS (No external imports needed) ---

async function ensureTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT CHECK (role IN ('retailer', 'admin')) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_anonymized BOOLEAN DEFAULT FALSE
      );
    `;
    
    // Seed Admin if empty
    const countRes = await sql`SELECT COUNT(*) as count FROM users`;
    if (Number(countRes.rows[0].count) === 0) {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash('hostsystems2018!', salt);
      await sql`
        INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at, is_anonymized)
        VALUES ('admin-user-id', 'andrew.lim@hostsystems.sg', ${hash}, 'Andrew Lim (Master Admin)', '+65 6717 6511', 'admin', NOW(), NOW(), FALSE)
      `;
    }
  } catch (err) {
    console.error('DB Init Error:', err);
  }
}

async function getUserByEmail(email: string) {
  try {
    const res = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
    return res.rows[0] || null;
  } catch (err) {
    console.error('Get User Error:', err);
    return null;
  }
}

async function createUser(user: any) {
  try {
    await sql`
      INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at, is_anonymized)
      VALUES (${user.id}, ${user.email}, ${user.passwordHash}, ${user.fullName}, ${user.phone}, ${user.role}, NOW(), NOW(), FALSE)
    `;
    return user;
  } catch (err) {
    console.error('Create User Error:', err);
    throw err;
  }
}

// --- API HANDLER ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ensure DB exists before any operation
    await ensureTables();

    const urlPath = req.url || '';
    const cleanPath = urlPath.replace(/^\//, '').split('?')[0];

    // HANDLE LOGIN
    if (req.method === 'POST' && (cleanPath === 'login' || cleanPath === '')) {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.is_anonymized) {
        return res.status(403).json({ error: 'Account anonymized' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
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
          fullName: user.full_name,
          role: user.role
        }
      });
    }

    // HANDLE REGISTER
    if (req.method === 'POST' && cleanPath === 'register') {
      const { email, password, fullName, phone } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Missing fields' });
      }

      const existing = await getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email exists' });
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
        role: 'retailer'
      };

      await createUser(newUser);

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

    // HANDLE GET ME (Protected)
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

      // Fetch fresh user data
      const resData = await sql`SELECT * FROM users WHERE id = ${payload.id}`;
      const user = resData.rows[0];

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('Auth API Crash:', error);
    return res.status(500).json({ 
      error: 'Server Error', 
      details: error.message 
    });
  }
}
