import { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb, Order, OrderItem } from "../../src/db/dbStore";
import { CreateOrderSchema } from "../../src/lib/validators";
import { authenticateUser } from "../authHelper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateUser(req, res);
  if (!user) return;

  const pathParts = req.query.all as string[] || [];
  const action = pathParts[0];
  const id = pathParts[1];

  // GET /api/orders or GET /api/orders/:id
  if (req.method === 'GET') {
    try {
      if (id) {
        // Get single order by ID
        const allOrders = await VercelDb.getOrders();
        const order = allOrders.find(o => o.id === id);
        if (!order) {
          return res.status(404).json({ success: false, error: "Order not found" });
        }
        // Check permissions
        if (user.role !== 'admin') {
          const retailer = await VercelDb.findRetailerByUserId(user.id);
          if (!retailer || order.retailerId !== retailer.id) {
            return res.status(403).json({ success: false, error: "Access denied" });
          }
        }
        return res.status(200).json({ success: true, data: order });
      } else {
        // Get all orders
        const allOrders = await VercelDb.getOrders();
        if (user.role === "admin") {
          return res.status(200).json({ success: true, data: allOrders });
        } else {
          const retailer = await VercelDb.findRetailerByUserId(user.id);
          if (!retailer) {
            return res.status(200).json({ success: true, data: [] });
          }
          return res.status(200).json({ success: true, data: allOrders.filter(o => o.retailerId === retailer.id) });
        }
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to extract orders ledger" });
    }
  }

  // POST /api/orders (create new order)
  if (req.method === 'POST' && !id) {
    try {
      if (user.role !== "retailer") {
        return res.status(403).json({ success: false, error: "Administrators cannot create order items as themselves" });
      }

      if (!(req as any).retailer) {
        return res.status(403).json({ success: false, error: "Unbound retailer identity" });
      }

      if ((req as any).retailer.status !== "Approved") {
        return res.status(403).json({ success: false, error: "Your distributor registration is pending approval or has been declined" });
      }

      const parsed = CreateOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      }

      const { procurementRef, items } = parsed.data;
      const productCatalog = await VercelDb.getProducts();
      let orderItemsList: OrderItem[] = [];
      let subtotal = 0;
      let totalQty = 0;
      let discountAmount = 0;

      const tierMult: any = { "Standard": 1.00, "Silver": 0.95, "Gold": 0.90, "Platinum": 0.85 };
      const multiplier = tierMult[(req as any).retailer.tier] || 1.00;

      for (const cartItem of items) {
        const prod = productCatalog.find(p => p.id === cartItem.productId);
        if (!prod) {
          return res.status(400).json({ success: false, error: `Product ID key ${cartItem.productId} is invalid` });
        }

        if (cartItem.qty < prod.moq) {
          return res.status(400).json({ success: false, error: `Insufficient entry quantity for ${prod.name}. The Minimum Order Quantity (MOQ) is strictly ${prod.moq} items.` });
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
          id: "item-" + Math.random().toString(36).substr(2, 9),
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
        retailerId: (req as any).retailer.id,
        userId: user.id,
        procurementRef,
        status: "Pending Payment Proof",
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
      return res.status(500).json({ success: false, error: err.message || "Failed to submit B2B order" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
