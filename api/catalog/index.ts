import { VercelDb, Product } from "../../src/db/dbStore";
import { ProductSchema } from "../../src/lib/validators";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    try {
      const items = await VercelDb.getProducts();
      return res.status(200).json({ success: true, data: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to extract product catalog details" });
    }
  }

  if (req.method === "POST") {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;

    try {
      const parsed = ProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      }

      const newId = "p-" + Math.random().toString(36).substr(2, 9);
      const newProduct: Product = {
        ...parsed.data,
        id: newId,
        createdAt: new Date().toISOString()
      };

      await VercelDb.saveProduct(newProduct);
      return res.status(201).json({ success: true, data: newProduct });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to compile and write product SKU record" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
