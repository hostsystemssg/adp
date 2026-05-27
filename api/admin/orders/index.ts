import { VercelDb, OrderItem, Order } from "../../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;
  if (!requireAdminUser(req, res)) return;

  try {
    const { retailerId, procurementRef, items } = req.body;

    if (!retailerId) {
      return res.status(400).json({ success: false, error: "retailerId is required to submit a B2B override order" });
    }

    const allRetailers = await VercelDb.getRetailers();
    const refRetailer = allRetailers.find(r => r.id === retailerId);
    if (!refRetailer) {
      return res.status(404).json({ success: false, error: "Retailer profile key can not be resolved in database" });
    }

    if (refRetailer.status !== "Approved") {
      return res.status(400).json({ success: false, error: "Cannot create orders for an unapproved business distributor" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Procurement items list cannot be empty" });
    }

    const productCatalog = await VercelDb.getProducts();
    let orderItemsList: any[] = [];
    let subtotal = 0;
    let totalQty = 0;
    let discountAmount = 0;

    const tierMult = {
      "Standard": 1.00,
      "Silver": 0.95,
      "Gold": 0.90,
      "Platinum": 0.85
    };
    const multiplier = tierMult[refRetailer.tier as keyof typeof tierMult] || 1.00;

    for (const cartItem of items) {
      const prod = productCatalog.find(p => p.id === cartItem.productId);
      if (!prod) {
        return res.status(400).json({ success: false, error: `Product ID keyword ${cartItem.productId} is invalid` });
      }

      let unitPrice = prod.wholesalePrice;
      let discountPct = 0;

      if (prod.isPreOrder) {
        discountPct = prod.preOrderDiscount;
        unitPrice = prod.wholesalePrice * (1 - discountPct / 100);
      } else {
        discountPct = Math.round((1 - multiplier) * 100);
        unitPrice = prod.wholesalePrice * multiplier;
      }

      const totalPrice = unitPrice * cartItem.qty;
      const rawWPrice = prod.wholesalePrice * cartItem.qty;
      const discountQtyVal = rawWPrice - totalPrice;

      subtotal += rawWPrice;
      totalQty += cartItem.qty;
      discountAmount += discountQtyVal;

      orderItemsList.push({
        id: "item-" + Math.random().toString(36).substring(2, 9),
        orderId: "", 
        productId: prod.id,
        qty: cartItem.qty,
        unitPrice: Number(unitPrice.toFixed(2)),
        totalPrice: Number(totalPrice.toFixed(2)),
        discountApplied: discountPct
      });

      if (!prod.isPreOrder) {
        prod.stockCount = Math.max(0, prod.stockCount - cartItem.qty);
        await VercelDb.saveProduct(prod);
      }
    }

    const orderId = "ORD-" + Date.now().toString().slice(-7) + "-" + Math.floor(Math.random() * 89 + 10);
    const totalAmount = subtotal - discountAmount;
    const orderItemsFinal = orderItemsList.map(oi => ({ ...oi, orderId }));

    const newOrder: Order = {
      id: orderId,
      retailerId: refRetailer.id,
      userId: user.id,
      procurementRef: procurementRef || ("ORD-ADMIN-" + Math.floor(100000 + Math.random() * 900000)),
      status: "Payment Verified", 
      totalQty,
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      receiptUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderItemsFinal
    };

    await VercelDb.saveOrder(newOrder);
    return res.status(201).json({ success: true, data: newOrder });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to submit administrative override B2B order" });
  }
}
