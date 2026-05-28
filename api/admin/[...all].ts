import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT } from '../../src/lib/jwt';
import { VercelDb } from '../../src/db/dbStore';
import { z } from 'zod';

// Initialize DB tables on cold start
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
    // Extract path segments (e.g., /api/admin/retailers/123 -> ['retailers', '123'])
    // Vercel strips /api/admin/ from the path before hitting this file
    const pathSegments = (req.url || '').replace(/^\/api\/admin\//, '').split('/').filter(Boolean);
    const resource = pathSegments[0];
    const id = pathSegments[1];

    // Admin Auth Check (except for health checks if needed)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    
    const token = authHeader.split(' ')[1];
    let user;
    try {
      user = await verifyJWT(token);
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Route Logic
    if (req.method === 'GET') {
      if (!resource) {
        return res.status(400).json({ error: 'Resource required' });
      }
      
      if (resource === 'retailers') {
        if (id) {
          // Get specific retailer logic would go here if needed via DB directly
          // For now, fetch all and filter (simplified for demo)
          const retailers = await VercelDb.getRetailers();
          const retailer = retailers.find(r => r.id === id);
          if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
          return res.status(200).json(retailer);
        } else {
          const retailers = await VercelDb.getRetailers();
          return res.status(200).json(retailers);
        }
      }
      
      if (resource === 'orders') {
         // Fetch orders logic
         const allOrders = await VercelDb.getOrders();
         if (id) {
            const order = allOrders.find(o => o.id === id);
            if (!order) return res.status(404).json({ error: 'Order not found' });
            return res.status(200).json(order);
         }
         return res.status(200).json(allOrders);
      }

      return res.status(404).json({ error: 'Resource not found' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (resource === 'retailers' && id) {
        const body = req.body;
        // Basic validation
        if (!body.status || !['Approved', 'Declined', 'Pending'].includes(body.status)) {
           return res.status(400).json({ error: 'Invalid status' });
        }
        
        const retailers = await VercelDb.getRetailers();
        const retailer = retailers.find(r => r.id === id);
        if (!retailer) return res.status(404).json({ error: 'Retailer not found' });

        const updatedRetailer = { ...retailer, status: body.status as any, updatedAt: new Date().toISOString() };
        await VercelDb.saveRetailer(updatedRetailer);
        return res.status(200).json(updatedRetailer);
      }
      return res.status(404).json({ error: 'Method not allowed for this resource' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error: any) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
