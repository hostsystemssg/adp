import { VercelDb, Product } from "../../src/db/dbStore";
import { ProductSchema } from "../../src/lib/validators";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, error: "Product specification key is required" });
  }

  if (req.method === "GET") {
    try {
      const items = await VercelDb.getProducts();
      const item = items.find(p => p.id === id);
      if (!item) {
        return res.status(404).json({ success: false, error: "Product SKU could not be located" });
      }
      return res.status(200).json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to read product record" });
    }
  }

  if (req.method === "PUT") {
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

      const updatedProduct: Product = {
        ...parsed.data,
        id,
        createdAt: existing.createdAt
      };

      await VercelDb.saveProduct(updatedProduct);
      return res.status(200).json({ success: true, data: updatedProduct });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to update product specs" });
    }
  }

  if (req.method === "DELETE") {
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
