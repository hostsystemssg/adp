import { VercelDb, Order, OrderItem } from "../../src/db/dbStore";
import { CreateOrderSchema } from "@/lib/validators";
import { authenticateUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  const user = await authenticateUser(req, res);
  if (!user) return;

  const { id, action } = req.query;

  // Handle POST to payment endpoint: /api/orders?action=payment&id=xxx
  if (req.method === "POST" && action === "payment") {
    return handlePayment(req, res, user);
  }

  // Handle GET for single order: /api/orders?id=xxx
  if (req.method === "GET" && id) {
    return handleGetOrder(req, res, user, id);
  }

  // Handle GET for all orders: /api/orders
  if (req.method === "GET" && !id) {
    return handleGetAllOrders(req, res, user);
  }

  // Handle POST for creating order: /api/orders
  if (req.method === "POST" && !id) {
    return handleCreateOrder(req, res, user);
  }

  return res.status(400).json({ success: false, error: "Invalid action or method" });
}

async function handleGetAllOrders(req: any, res: any, user: any) {
  try {
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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to extract orders ledger" });
  }
}

async function handleCreateOrder(req: any, res: any, user: any) {
  try {
    if (user.role !== "retailer") {
      return res.status(403).json({ success: false, error: "Administrators cannot create order items as themselves" });
    }

    if (!req.retailer) {
      return res.status(403).json({ success: false, error: "Unbound retailer identity" });
    }

    if (req.retailer.status !== "Approved") {
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

    const tierMult = {
      "Standard": 1.00,
      "Silver": 0.95,
      "Gold": 0.90,
      "Platinum": 0.85
    };
    
    const multiplier = tierMult[req.retailer.tier as keyof typeof tierMult] || 1.00;

    for (const cartItem of items) {
      const prod = productCatalog.find(p => p.id === cartItem.productId);
      if (!prod) {
        return res.status(400).json({ success: false, error: `Product ID key ${cartItem.productId} is invalid` });
      }

      if (cartItem.qty < prod.moq) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient entry quantity for ${prod.name}. The Minimum Order Quantity (MOQ) is strictly ${prod.moq} items.`
        });
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
      retailerId: req.retailer.id,
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

async function handleGetOrder(req: any, res: any, user: any, id: string) {
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

async function handlePayment(req: any, res: any, user: any) {
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
