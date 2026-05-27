import { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb } from '../../src/db/dbStore';
import { verifyToken } from '../authHelper';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as JwtPayload;
    
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Parse the path to determine which admin operation
    const pathParts = (req.query.all as string[]) || [];
    
    // Handle /api/admin/anonymize
    if (pathParts[0] === 'anonymize') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const users = await VercelDb.getUsers();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      let updated = 0;
      for (const user of users) {
        if (user.role === 'retailer' && !user.isAnonymized) {
          const createdAt = new Date(user.createdAt);
          if (createdAt < twoYearsAgo) {
            user.fullName = '[REDACTED]';
            user.phone = '[REDACTED]';
            user.email = `redacted-${user.id}@anonymous.local`;
            user.isAnonymized = true;
            user.updatedAt = new Date().toISOString();
            await VercelDb.saveUser(user);
            updated++;
          }
        }
      }

      return res.status(200).json({ 
        message: `Successfully anonymized ${updated} dormant retailer accounts`,
        count: updated 
      });
    }

    // Handle /api/admin/retailers
    if (pathParts[0] === 'retailers') {
      if (req.method === 'GET') {
        const retailers = await VercelDb.getRetailers();
        return res.status(200).json(retailers);
      }

      if (req.method === 'PUT' && pathParts[1]) {
        // Update retailer status/tier: /api/admin/retailers/[id]
        const retailerId = pathParts[1];
        const { status, tier } = req.body;
        
        const retailers = await VercelDb.getRetailers();
        const retailer = retailers.find(r => r.id === retailerId);
        
        if (!retailer) {
          return res.status(404).json({ error: 'Retailer not found' });
        }

        if (status) retailer.status = status;
        if (tier) retailer.tier = tier;
        retailer.updatedAt = new Date().toISOString();
        
        await VercelDb.saveRetailer(retailer);
        return res.status(200).json(retailer);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle /api/admin/orders
    if (pathParts[0] === 'orders') {
      if (req.method === 'GET') {
        const orders = await VercelDb.getOrders();
        
        // Enrich with retailer info
        const retailers = await VercelDb.getRetailers();
        const enriched = orders.map(order => {
          const retailer = retailers.find(r => r.id === order.retailerId);
          return {
            ...order,
            retailerName: retailer?.companyName || 'Unknown',
            retailerTier: retailer?.tier || 'Standard'
          };
        });
        
        return res.status(200).json(enriched);
      }

      if (req.method === 'PUT' && pathParts[1]) {
        // Update order status: /api/admin/orders/[id]
        const orderId = pathParts[1];
        const { status } = req.body;
        
        const orders = await VercelDb.getOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        if (status) {
          order.status = status;
          order.updatedAt = new Date().toISOString();
          await VercelDb.saveOrder(order);
        }
        
        return res.status(200).json(order);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(404).json({ error: 'Unknown admin endpoint' });

  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
