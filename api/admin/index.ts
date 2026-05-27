import { VercelDb } from "../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  const user = await authenticateUser(req, res);
  if (!user) return;
  if (!requireAdminUser(req, res)) return;

  const { action, id } = req.query;

  // Handle GET /api/admin/retailers - list all retailers
  if (req.method === "GET" && !id) {
    try {
      const reps = await VercelDb.getRetailers();
      const users = await VercelDb.getUsers();
      const populated = reps.map(r => {
        const matched = users.find(u => u.id === r.userId);
        return {
          ...r,
          user: matched ? { email: matched.email, fullName: matched.fullName, phone: matched.phone, isAnonymized: matched.isAnonymized } : null
        };
      });
      return res.status(200).json({ success: true, data: populated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to extract distributor applications" });
    }
  }

  // Handle PATCH /api/admin/retailers?id=xxx - update retailer status/tier
  if (req.method === "PATCH" && id) {
    try {
      const { status, tier } = req.body;

      const reps = await VercelDb.getRetailers();
      const rep = reps.find(r => r.id === id);

      if (!rep) {
        return res.status(404).json({ success: false, error: "Retailer profile key could not be resolved" });
      }

      if (status) {
        if (!["Pending", "Approved", "Declined"].includes(status)) {
          return res.status(400).json({ success: false, error: "Invalid status value designation" });
        }
        rep.status = status;
      }

      if (tier) {
        if (!["Standard", "Silver", "Gold", "Platinum"].includes(tier)) {
          return res.status(400).json({ success: false, error: "Invalid distributor tier tiering" });
        }
        rep.tier = tier;
      }

      rep.updatedAt = new Date().toISOString();
      await VercelDb.saveRetailer(rep);

      return res.status(200).json({ success: true, data: rep });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to mutate retailer attributes" });
    }
  }

  // Handle POST /api/admin/orders - create admin override order
  if (req.method === "POST" && action === "orders") {
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

      const newOrder = {
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

  // Handle PATCH /api/admin/orders?id=xxx - update order status
  if (req.method === "PATCH" && action === "orders" && id) {
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

  // Handle GET /api/admin/anonymize - list dormant accounts
  if (req.method === "GET" && action === "anonymize") {
    try {
      const users = (await VercelDb.getUsers()).filter(u => u.role !== "admin" && !u.isAnonymized);
      const orders = await VercelDb.getOrders();

      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);

      const dormantAccounts = [];
      for (const u of users) {
        const ret = await VercelDb.findRetailerByUserId(u.id);
        const lastActivityDate = new Date(u.createdAt);
        let isDormant = false;

        if (ret) {
          const retOrders = orders.filter(o => o.retailerId === ret.id);
          if (retOrders.length > 0) {
            const latestOrderDate = new Date(Math.max(...retOrders.map(o => new Date(o.createdAt).getTime())));
            isDormant = latestOrderDate < cutoff;
          } else {
            isDormant = lastActivityDate < cutoff;
          }
        } else {
          isDormant = lastActivityDate < cutoff;
        }

        if (isDormant) {
          dormantAccounts.push({ id: u.id, email: u.email, name: u.fullName, registeredAt: u.createdAt });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          dormantCount: dormantAccounts.length,
          dormantUsers: dormantAccounts
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to collect data retention metrics" });
    }
  }

  // Handle POST /api/admin/anonymize - execute anonymization
  if (req.method === "POST" && action === "anonymize") {
    try {
      const users = (await VercelDb.getUsers()).filter(u => u.role !== "admin" && !u.isAnonymized);
      const orders = await VercelDb.getOrders();

      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);

      let anonymizedCounter = 0;

      for (const u of users) {
        const ret = await VercelDb.findRetailerByUserId(u.id);
        const lastActivityDate = new Date(u.createdAt);
        let isDormant = false;

        if (ret) {
          const retOrders = orders.filter(o => o.retailerId === ret.id);
          if (retOrders.length > 0) {
            const latestOrderDate = new Date(Math.max(...retOrders.map(o => new Date(o.createdAt).getTime())));
            isDormant = latestOrderDate < cutoff;
          } else {
            isDormant = lastActivityDate < cutoff;
          }
        } else {
          isDormant = lastActivityDate < cutoff;
        }

        if (isDormant) {
          u.fullName = "[REDACTED VENDOR]";
          u.email = `anonymized-${u.id}@redacted-portal.one`;
          u.phone = "+65 REDACTED";
          u.passwordHash = "REDACTED";
          u.isAnonymized = true;
          u.updatedAt = new Date().toISOString();
          await VercelDb.saveUser(u);

          if (ret) {
            ret.companyName = "[REDACTED ENTERPRISE]";
            ret.uen = "REDACTED";
            ret.address = "REDACTED, Singapore";
            ret.postalCode = "000000";
            ret.showroomLocations = "REDACTED";
            await VercelDb.saveRetailer(ret);
          }

          anonymizedCounter++;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Anonymisation sequence complete. ${anonymizedCounter} dormant account(s) redacted per PDPA standards.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Data retention cleaning workflow failed" });
    }
  }

  return res.status(400).json({ success: false, error: "Invalid admin action" });
}
