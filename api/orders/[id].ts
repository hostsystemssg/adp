import { VercelDb } from "../../src/db/dbStore";
import { authenticateUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  const user = await authenticateUser(req, res);
  if (!user) return;

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, error: "Order context parameter is required" });
  }

  if (req.method === "GET") {
    try {
      const allOrders = await VercelDb.getOrders();
      const order = allOrders.find(o => o.id === id);

      if (!order) {
        return res.status(404).json({ success: false, error: "Order details could not be resolved" });
      }

      if (user.role !== "admin") {
        const retailer = await VercelDb.findRetailerByUserId(user.id);
        if (!retailer || order.retailerId !== retailer.id) {
          return res.status(403).json({ success: false, error: "You possess no authorization to view this order record" });
        }
      }

      return res.status(200).json({ success: true, data: order });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to fetch order details" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
