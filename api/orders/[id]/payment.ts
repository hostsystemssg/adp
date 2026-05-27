import { VercelDb } from "../../../src/db/dbStore";
import { authenticateUser } from "../../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, error: "Order reference is required" });
  }

  try {
    const allOrders = await VercelDb.getOrders();
    const order = allOrders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order record not found" });
    }

    if (user.role !== "retailer") {
      return res.status(403).json({ success: false, error: "Only retail agents can upload payment invoices" });
    }

    const { receiptUrl } = req.body;
    if (!receiptUrl) {
      return res.status(400).json({ success: false, error: "Bank deposit slip / payment document image payload is required" });
    }

    order.receiptUrl = receiptUrl;
    order.updatedAt = new Date().toISOString();
    order.status = "Pending Payment Proof"; 
    await VercelDb.saveOrder(order);

    return res.status(200).json({ 
      success: true, 
      data: order, 
      message: "Payment proof receipt logged successfully. Point One finance team will audit shortly." 
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to append payment confirmation slip" });
  }
}
