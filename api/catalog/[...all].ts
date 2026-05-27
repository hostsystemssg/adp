import { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb, Product } from "../../src/db/dbStore";
import { ProductSchema } from "../../src/lib/validators";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParts = req.query.all as string[] || [];
  const id = pathParts[0];

  // GET /api/catalog or GET /api/catalog/:id
  if (req.method === 'GET') {
    try {
      const items = await VercelDb.getProducts();
      if (id) {
        const item = items.find(p => p.id === id);
        if (!item) {
          return res.status(404).json({ success: false, error: "Product SKU could not be located" });
        }
        return res.status(200).json({ success: true, data: item });
      }
      return res.status(200).json({ success: true, data: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to extract product catalog details" });
    }
  }

  // POST /api/catalog (admin only)
  if (req.method === 'POST') {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;

    try {
      const parsed = ProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      }

      const newId = "p-" + Math.random().toString(36).substr(2, 9);
      const newProduct: Product = { ...parsed.data, id: newId, createdAt: new Date().toISOString() };
      await VercelDb.saveProduct(newProduct);
      return res.status(201).json({ success: true, data: newProduct });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to compile and write product SKU record" });
    }
  }

  // PUT /api/catalog/:id (admin only)
  if (req.method === 'PUT' && id) {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;

    try {
      const parsed = ProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      }

      const productsList = await VercelDb.getProducts();
      const existing = productsList.find(p => p.id === id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "The targeted product code is not present" });
      }

      const updatedProduct: Product = { ...parsed.data, id, createdAt: existing.createdAt };
      await VercelDb.saveProduct(updatedProduct);
      return res.status(200).json({ success: true, data: updatedProduct });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to update product specs" });
    }
  }

  // DELETE /api/catalog/:id (admin only)
  if (req.method === 'DELETE' && id) {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;

    try {
      const success = await VercelDb.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Product SKU to delete could not be resolved" });
      }
      return res.status(200).json({ success: true, message: "Product SKU deleted successfully" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to delete SKU from records" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
