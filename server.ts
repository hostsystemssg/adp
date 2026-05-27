import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import { DB, User, Retailer, Product, Order, OrderItem, ConsentRecord } from "./src/db/dbStore";
import { verifyJWT, signJWT } from "./src/lib/jwt";
import { RegisterSchema, LoginSchema, ProductSchema, CreateOrderSchema, ConsentPatchSchema } from "./src/lib/validators";
import { COMPANY } from "./src/lib/constants";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Helper middleware to authenticate JWT requests (multi-tier verification)
  const authenticate = async (req: any, res: any, next: any) => {
    let token = "";
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      // Fallback to cookie if cookie parser/manual parsing is done
      const cookieHeader = req.headers.cookie || "";
      const cookies = Object.fromEntries(cookieHeader.split(";").map((c: string) => c.trim().split("=")));
      token = cookies["token"] || "";
    }

    if (!token) {
      return res.status(401).json({ success: false, error: "Access token is missing or expired" });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return res.status(401).json({ success: false, error: "Invalid premium security session token" });
    }

    // Refresh database instances
    const users = DB.getUsers();
    const user = users.find(u => u.id === payload.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: "User session associated with this token no longer exists" });
    }

    if (user.isAnonymized) {
      return res.status(403).json({ success: false, error: "This account has been anonymized per customer request" });
    }

    req.user = user;
    if (user.role === "retailer") {
      const retailer = DB.findRetailerByUserId(user.id);
      req.retailer = retailer;
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Privileged administrator permissions are required" });
    }
    next();
  };

  // API Route - System Health
  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Point One Technology Enterprise API Online" });
  });

  // API Routes - FAQ System (Unified and Dynamic)
  app.get("/api/faq", (req, res) => {
    try {
      const faqs = DB.getFaqs();
      res.json({ success: true, data: faqs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to read FAQ list" });
    }
  });

  app.post("/api/faq", authenticate, requireAdmin, (req: any, res: any) => {
    try {
      const { id, q, a } = req.body;
      if (!q || !a) {
        return res.status(400).json({ success: false, error: "Question and Answer fields are required" });
      }
      const faqId = id && id !== "new" ? id : "faq-" + Math.random().toString(36).substr(2, 9);
      const saved = DB.saveFaq({
        id: faqId,
        q: q.trim(),
        a: a.trim(),
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to save FAQ listing" });
    }
  });

  app.delete("/api/faq/:id", authenticate, requireAdmin, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const deleted = DB.deleteFaq(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "FAQ index not found in database" });
      }
      res.json({ success: true, data: { status: "deleted", id } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to remove FAQ" });
    }
  });

  // API Route - Register with PDPA Consent Check
  app.post("/api/auth/register", async (req: any, res: any) => {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorDetail = parsed.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ success: false, error: errorDetail });
      }

      const { email, password, fullName, phone, companyName, uen, address, postalCode, showroomLocations, consentGiven } = parsed.data;

      // Check existing email
      const users = DB.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ success: false, error: "This corporate email address is already registered" });
      }

      // Check existing UEN
      const retailers = DB.getRetailers();
      if (retailers.some(r => r.uen.toLowerCase() === uen.toLowerCase())) {
        return res.status(400).json({ success: false, error: "A corporate retailer with this UEN is already registered" });
      }

      // Hash password with bcryptjs (work factor 12)
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = "u-" + Math.random().toString(36).substr(2, 9);
      const retailerId = "ret-" + Math.random().toString(36).substr(2, 9);

      // Save User
      const newUser: User = {
        id: userId,
        email,
        passwordHash,
        fullName,
        phone,
        role: "retailer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnonymized: false
      };
      DB.saveUser(newUser);

      // Save Retailer application defaults (Standard tier, Pending status)
      const newRetailer: Retailer = {
        id: retailerId,
        userId,
        companyName,
        uen,
        address,
        postalCode,
        showroomLocations,
        tier: "Standard",
        status: "Pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      DB.saveRetailer(newRetailer);

      // Write PDPA Consent Record to DB
      const ipAddress = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "Unknown B2B Browser";

      const newConsent: ConsentRecord = {
        id: "con-" + Math.random().toString(36).substr(2, 9),
        userId,
        purpose: "registration",
        givenAt: new Date().toISOString(),
        withdrawnAt: null,
        ipAddress: String(ipAddress),
        userAgent
      };
      DB.saveConsentRecord(newConsent);

      // Create Session JWT
      const token = await signJWT({
        userId,
        email,
        role: "retailer",
        retailerId,
        companyName,
        tier: "Standard"
      });

      res.json({
        success: true,
        data: {
          user: { id: userId, email, fullName, role: "retailer" },
          retailer: newRetailer,
          token
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to complete registration" });
    }
  });

  // API Route - Login
  app.post("/api/auth/login", async (req: any, res: any) => {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      }

      const { email, password } = parsed.data;

      const users = DB.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(401).json({ success: false, error: "Incorrect email credentials or password" });
      }

      if (user.isAnonymized) {
        return res.status(403).json({ success: false, error: "This account has been anonymized per customer request" });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, error: "Incorrect email credentials or password" });
      }

      let retailer: Retailer | undefined;
      let tokenPayload: any = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      if (user.role === "retailer") {
        retailer = DB.findRetailerByUserId(user.id);
        if (!retailer) {
          return res.status(403).json({ success: false, error: "User account lacks active retailer record" });
        }
        tokenPayload.retailerId = retailer.id;
        tokenPayload.companyName = retailer.companyName;
        tokenPayload.tier = retailer.tier;
      }

      const token = await signJWT(tokenPayload);

      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
          retailer,
          token
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Login authentication failed" });
    }
  });

  // API Route - Retrieve authenticated session details
  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json({
      success: true,
      data: {
        user: { id: req.user.id, email: req.user.email, fullName: req.user.fullName, role: req.user.role },
        retailer: req.retailer || null
      }
    });
  });

  // API Route - Catalog Fetch All (accessible to signed-in partners & admins, or guests showing baseline info)
  app.get("/api/catalog", (req, res) => {
    try {
      const items = DB.getProducts();
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to extract product catalog details" });
    }
  });

  // API Route - Catalog Single Specs Fetch
  app.get("/api/catalog/:id", (req, res) => {
    try {
      const items = DB.getProducts();
      const item = items.find(p => p.id === req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, error: "Product SKU could not be found" });
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to read product record" });
    }
  });

  // API Route - Create Product Catalog SKU (Admin CRUD)
  app.post("/api/catalog", authenticate, requireAdmin, (req: any, res) => {
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

      DB.saveProduct(newProduct);
      res.status(201).json({ success: true, data: newProduct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compile and write product SKU record" });
    }
  });

  // API Route - Edit Product Catalog SKU (Admin CRUD)
  app.put("/api/catalog/:id", authenticate, requireAdmin, (req: any, res) => {
    try {
      const parsed = ProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      }

      const id = req.params.id;
      const productsList = DB.getProducts();
      const existing = productsList.find(p => p.id === id);

      if (!existing) {
        return res.status(404).json({ success: false, error: "The targeted product code is not present" });
      }

      const updatedProduct: Product = {
        ...parsed.data,
        id,
        createdAt: existing.createdAt
      };

      DB.saveProduct(updatedProduct);
      res.json({ success: true, data: updatedProduct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to update product specs" });
    }
  });

  // API Route - Destroy Product SKU (Admin CRUD)
  app.delete("/api/catalog/:id", authenticate, requireAdmin, (req: any, res) => {
    try {
      const success = DB.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Product SKU to delete could not be resolved" });
      }
      res.json({ success: true, message: "Product SKU deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to delete SKU from records" });
    }
  });

  // API Route - Customer Order Creation
  app.post("/api/orders", authenticate, (req: any, res) => {
    try {
      if (req.user.role !== "retailer") {
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

      const productCatalog = DB.getProducts();
      let orderItemsList: OrderItem[] = [];
      let subtotal = 0;
      let totalQty = 0;
      let discountAmount = 0;

      // Tier Discounts Map
      // Standard: 0%, Silver: 5%, Gold: 10%, Platinum: 15% override
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

        // Validate MOQ
        if (cartItem.qty < prod.moq) {
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient entry quantity for ${prod.name}. The Minimum Order Quantity (MOQ) is strictly ${prod.moq} items.`
          });
        }

        // Apply pre-order campaign or tiered markdown
        let unitPrice = prod.wholesalePrice;
        let discountPct = 0;

        if (prod.isPreOrder) {
          // Pre-orders have static compound campaign markdowns
          discountPct = prod.preOrderDiscount; 
          unitPrice = prod.wholesalePrice * (1 - discountPct / 100);
        } else {
          // Normal products apply retailer tier markdown
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
          orderId: "", // backfilled below
          productId: prod.id,
          qty: cartItem.qty,
          unitPrice: Number(unitPrice.toFixed(2)),
          totalPrice: Number(totalPrice.toFixed(2)),
          discountApplied: discountPct
        });

        // Deduct inventory if in stock (virtual simulation)
        if (!prod.isPreOrder) {
          prod.stockCount = Math.max(0, prod.stockCount - cartItem.qty);
          DB.saveProduct(prod);
        }
      }

      const orderId = "ORD-" + Date.now().toString().slice(-7) + "-" + Math.floor(Math.random() * 89 + 10);
      const totalAmount = subtotal - discountAmount;

      const orderItemsFinal = orderItemsList.map(oi => ({ ...oi, orderId }));

      const newOrder: Order = {
        id: orderId,
        retailerId: req.retailer.id,
        userId: req.user.id,
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

      DB.saveOrder(newOrder);

      res.status(201).json({ success: true, data: newOrder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to submit B2B order" });
    }
  });

  // API Route - Fetch Order List
  app.get("/api/orders", authenticate, (req: any, res) => {
    try {
      const allOrders = DB.getOrders();
      if (req.user.role === "admin") {
        res.json({ success: true, data: allOrders });
      } else {
        const retailer = DB.findRetailerByUserId(req.user.id);
        if (!retailer) {
          return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: allOrders.filter(o => o.retailerId === retailer.id) });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to extract orders ledger" });
    }
  });

  // API Route - Single Order Detail & Payment Proof Upload (base64 image proof)
  app.get("/api/orders/:id", authenticate, (req: any, res) => {
    try {
      const allOrders = DB.getOrders();
      const order = allOrders.find(o => o.id === req.params.id);

      if (!order) {
        return res.status(404).json({ success: false, error: "Order details could not be resolved" });
      }

      // Authorization gate
      if (req.user.role !== "admin") {
        const retailer = DB.findRetailerByUserId(req.user.id);
        if (!retailer || order.retailerId !== retailer.id) {
          return res.status(403).json({ success: false, error: "You possess no authorization to view this order record" });
        }
      }

      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to fetch order details" });
    }
  });

  // API Route - Submit bank receipt proof screenshot (Submit invoice receipt proof)
  app.post("/api/orders/:id/payment", authenticate, (req: any, res) => {
    try {
      const allOrders = DB.getOrders();
      const order = allOrders.find(o => o.id === req.params.id);

      if (!order) {
        return res.status(404).json({ success: false, error: "Order record not found" });
      }

      if (req.user.role !== "retailer") {
        return res.status(403).json({ success: false, error: "Only retail agents can upload payment invoices" });
      }

      const { receiptUrl } = req.body;
      if (!receiptUrl) {
        return res.status(400).json({ success: false, error: "Bank deposit slip / payment document image payload is required" });
      }

      order.receiptUrl = receiptUrl;
      order.updatedAt = new Date().toISOString();
      order.status = "Pending Payment Proof"; // keep/updates state
      DB.saveOrder(order);

      res.json({ success: true, data: order, message: "Payment proof receipt logged successfully. Point One finance team will audit shortly." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to append payment confirmation slip" });
    }
  });

  // API Route - Admin Distributor Management (Modify retailer application status or promote tiers)
  app.get("/api/admin/retailers", authenticate, requireAdmin, (req, res) => {
    try {
      const reps = DB.getRetailers();
      const users = DB.getUsers();
      const populated = reps.map(r => {
        const matched = users.find(u => u.id === r.userId);
        return {
          ...r,
          user: matched ? { email: matched.email, fullName: matched.fullName, phone: matched.phone, isAnonymized: matched.isAnonymized } : null
        };
      });
      res.json({ success: true, data: populated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to extract distributor applications" });
    }
  });

  // API Route - Patch Application Status Or Promote Tier
  app.patch("/api/admin/retailers/:id", authenticate, requireAdmin, (req: any, res) => {
    try {
      const { status, tier } = req.body;
      const reps = DB.getRetailers();
      const rep = reps.find(r => r.id === req.params.id);

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
      DB.saveRetailer(rep);

      res.json({ success: true, data: rep });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to mutate retailer attributes" });
    }
  });

  // API Route - Mutate Order Status (Advanced State Machine)
  app.patch("/api/admin/orders/:id", authenticate, requireAdmin, (req: any, res) => {
    try {
      const { status } = req.body;
      const allOrders = DB.getOrders();
      const order = allOrders.find(o => o.id === req.params.id);

      if (!order) {
        return res.status(404).json({ success: false, error: "Target order reference cannot be found" });
      }

      const VALID_STATUSES = ["Pending Payment Proof", "Payment Verified", "Processing", "Dispatched"];
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid workflow status requested" });
      }

      order.status = status;
      order.updatedAt = new Date().toISOString();
      DB.saveOrder(order);

      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to move order stage forward" });
    }
  });

  // API Route - Administrative Order Submission (On-behalf of a Retailer)
  app.post("/api/admin/orders", authenticate, requireAdmin, (req: any, res) => {
    try {
      const { retailerId, procurementRef, items } = req.body;

      if (!retailerId) {
        return res.status(400).json({ success: false, error: "retailerId is required to submit a B2B override order" });
      }

      const allRetailers = DB.getRetailers();
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

      const productCatalog = DB.getProducts();
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
          orderId: "", // backfilled below
          productId: prod.id,
          qty: cartItem.qty,
          unitPrice: Number(unitPrice.toFixed(2)),
          totalPrice: Number(totalPrice.toFixed(2)),
          discountApplied: discountPct
        });

        if (!prod.isPreOrder) {
          prod.stockCount = Math.max(0, prod.stockCount - cartItem.qty);
          DB.saveProduct(prod);
        }
      }

      const orderId = "ORD-" + Date.now().toString().slice(-7) + "-" + Math.floor(Math.random() * 89 + 10);
      const totalAmount = subtotal - discountAmount;
      const orderItemsFinal = orderItemsList.map(oi => ({ ...oi, orderId }));

      const newOrder: any = {
        id: orderId,
        retailerId: refRetailer.id,
        userId: req.user.id,
        procurementRef: procurementRef || ("ORD-ADMIN-" + Math.floor(100000 + Math.random() * 900000)),
        status: "Payment Verified", // Admin orders are pre-verified automatically
        totalQty,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        receiptUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: orderItemsFinal
      };

      DB.saveOrder(newOrder);

      res.status(201).json({ success: true, data: newOrder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to submit administrative override B2B order" });
    }
  });

  // API Route - PDPA Consent management (Fetch active consents / settings)
  app.get("/api/consent", authenticate, (req: any, res) => {
    try {
      const consents = DB.getConsentRecords().filter(c => c.userId === req.user.id);
      res.json({ success: true, data: consents });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to pull consent profiles" });
    }
  });

  // API Route - Withdraw Consent
  app.patch("/api/consent/:purpose", authenticate, (req: any, res) => {
    try {
      const purpose = req.params.purpose; // 'registration' | 'marketing' | 'analytics'
      const parsed = ConsentPatchSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Request payload contains errors" });
      }

      const records = DB.getConsentRecords();
      const record = records.find(c => c.userId === req.user.id && c.purpose === purpose && c.withdrawnAt === null);

      let impactStatement = "";
      if (purpose === "registration") {
        impactStatement = "CRITICAL WARNING: Withdrawing consent for account registration forces Point One Technology to deactivate and suspend your B2B account access, terminating any open pre-order lines per the PDPA Purpose Limitation guidelines.";
      } else if (purpose === "marketing") {
        impactStatement = "Notice: Withdrawing consent for wholesale promotions disables all upcoming pre-order catalog launches and volume tier rebate distributions.";
      } else {
        impactStatement = "Notice: Anonymized analytics cookie access disabled.";
      }

      if (parsed.data.withdrawn) {
        if (record) {
          record.withdrawnAt = new Date().toISOString();
          DB.saveConsentRecord(record);
        } else {
          // If no existing record, create a placeholder and withdraw it immediately
          const ipAddress = req.ip || "127.0.0.1";
          const newRec: ConsentRecord = {
            id: "con-" + Math.random().toString(36).substr(2, 9),
            userId: req.user.id,
            purpose: purpose as any,
            givenAt: new Date().toISOString(),
            withdrawnAt: new Date().toISOString(),
            ipAddress: String(ipAddress),
            userAgent: req.headers["user-agent"] || "Agent"
          };
          DB.saveConsentRecord(newRec);
        }

        // If registration is withdrawn, automatically lock or set reseller status to Suspended / Pending
        if (purpose === "registration") {
          const ret = DB.findRetailerByUserId(req.user.id);
          if (ret) {
            ret.status = "Pending"; // lock actions
            DB.saveRetailer(ret);
          }
        }
      } else {
        // Re-enable/re-giving consent
        const matched = records.find(c => c.userId === req.user.id && c.purpose === purpose);
        if (matched) {
          matched.withdrawnAt = null;
          DB.saveConsentRecord(matched);
        } else {
          const ipAddress = req.ip || "127.0.0.1";
          const newRec: ConsentRecord = {
            id: "con-" + Math.random().toString(36).substr(2, 9),
            userId: req.user.id,
            purpose: purpose as any,
            givenAt: new Date().toISOString(),
            withdrawnAt: null,
            ipAddress: String(ipAddress),
            userAgent: req.headers["user-agent"] || "Agent"
          };
          DB.saveConsentRecord(newRec);
        }
        
        if (purpose === "registration") {
          const ret = DB.findRetailerByUserId(req.user.id);
          if (ret) {
            ret.status = "Approved"; // RESTORE status
            DB.saveRetailer(ret);
          }
        }
      }

      res.json({
        success: true,
        message: "Consent state modified",
        data: {
          purpose,
          withdrawn: parsed.data.withdrawn,
          notice: impactStatement
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to modify PDPA consent parameters" });
    }
  });

  // API Route - Get Anonymization Metrics for Admin settings page
  app.get("/api/admin/anonymize", authenticate, requireAdmin, (req, res) => {
    try {
      const users = DB.getUsers().filter(u => u.role !== "admin" && !u.isAnonymized);
      const orders = DB.getOrders();

      // Accounts are deemed "dormant" if inactive for more than 2 years from their latest order OR registration date
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);

      const dormantAccounts = users.filter(user => {
        const ret = DB.findRetailerByUserId(user.id);
        const lastActivityDate = new Date(user.createdAt);

        if (ret) {
          const retOrders = orders.filter(o => o.retailerId === ret.id);
          if (retOrders.length > 0) {
            const latestOrderDate = new Date(Math.max(...retOrders.map(o => new Date(o.createdAt).getTime())));
            return latestOrderDate < cutoff;
          }
        }
        return lastActivityDate < cutoff;
      });

      res.json({
        success: true,
        data: {
          dormantCount: dormantAccounts.length,
          dormantUsers: dormantAccounts.map(u => ({ id: u.id, email: u.email, name: u.fullName, registeredAt: u.createdAt }))
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to collect data retention metrics" });
    }
  });

  // API Route - Execute Anonymization trigger
  app.post("/api/admin/anonymize", authenticate, requireAdmin, (req, res) => {
    try {
      const users = DB.getUsers().filter(u => u.role !== "admin" && !u.isAnonymized);
      const orders = DB.getOrders();

      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);

      let anonymizedCounter = 0;

      users.forEach(user => {
        const ret = DB.findRetailerByUserId(user.id);
        const lastActivityDate = new Date(user.createdAt);
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
          // Perform Anonymization (Redact PII fields while preserving non-identifiable financial audit metrics)
          user.fullName = "[REDACTED VENDOR]";
          user.email = `anonymized-${user.id}@redacted-portal.one`;
          user.phone = "+65 REDACTED";
          user.passwordHash = "REDACTED";
          user.isAnonymized = true;
          user.updatedAt = new Date().toISOString();
          DB.saveUser(user);

          if (ret) {
            ret.companyName = "[REDACTED ENTERPRISE]";
            ret.uen = "REDACTED";
            ret.address = "REDACTED, Singapore";
            ret.postalCode = "000000";
            ret.showroomLocations = "REDACTED";
            DB.saveRetailer(ret);
          }

          anonymizedCounter++;
        }
      });

      res.json({
        success: true,
        message: `Anonymisation sequence complete. ${anonymizedCounter} dormant account(s) redacted per PDPA standards.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Data retention cleaning workflow failed" });
    }
  });

  // API Route - Specific User data extraction ("My Data" JSON download)
  app.get("/api/auth/my-data", authenticate, (req: any, res) => {
    try {
      const dbUsers = DB.getUsers();
      const dbRetailers = DB.getRetailers();
      const dbConsents = DB.getConsentRecords();
      const dbOrders = DB.getOrders();

      const myId = req.user.id;
      const userObj = dbUsers.find(u => u.id === myId);
      const retObj = dbRetailers.find(r => r.userId === myId);
      const consentsObj = dbConsents.filter(c => c.userId === myId);
      const ordersObj = retObj ? dbOrders.filter(o => o.retailerId === retObj.id) : [];

      res.json({
        success: true,
        data: {
          userRecord: {
            fullName: userObj?.fullName,
            email: userObj?.email,
            phone: userObj?.phone,
            createdAt: userObj?.createdAt
          },
          corporateProfile: retObj ? {
            companyName: retObj.companyName,
            uen: retObj.uen,
            address: retObj.address,
            postalCode: retObj.postalCode,
            showroomLocations: retObj.showroomLocations,
            tier: retObj.tier,
            status: retObj.status
          } : null,
          pdpConsentHistory: consentsObj.map(c => ({
            purpose: c.purpose,
            givenAt: c.givenAt,
            withdrawnAt: c.withdrawnAt,
            loggedIp: c.ipAddress,
            browser: c.userAgent
          })),
          procurementHistory: ordersObj.map(o => ({
            orderId: o.id,
            totalPriceSingaporeDollars: o.totalAmount,
            status: o.status,
            createdAt: o.createdAt
          }))
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to package user dataset" });
    }
  });

  // Serve static assets or use Vite dev server middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`B2B Enterprise Portal running on http://localhost:${PORT}`);
  });
}

startServer();
