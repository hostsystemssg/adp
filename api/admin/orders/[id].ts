import { VercelDb } from "../../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;
  if (!requireAdminUser(req, res)) return;

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, error: "Order designation parameter is required" });
  }

  try {
    const { status } = req.body;
    const allOrders = await VercelDb.getOrders();
    const order = allOrders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Target order reference cannot be found" });
    }

    const VALID_STATUSES = ["Pending Payment Proof", "Payment Verified", "Processing", "Dispatched"];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid workflow status requested" });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    await VercelDb.saveOrder(order);

    return res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to move order stage forward" });
  }
}
