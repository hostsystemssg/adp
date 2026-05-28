import type { VercelRequest, VercelResponse } from '@vercel/node';

// Minimal handler to test routing
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple Response for Testing
  return res.status(200).json({ 
    message: 'Auth API is working!', 
    path: req.url, 
    method: req.method 
  });
}
