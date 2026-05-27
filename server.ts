import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Import consolidated Vercel-compatible serverless api handlers
import healthHandler from "./api/health";
import faqHandler from "./api/faq/index";
import authHandler from "./api/auth/index";
import catalogHandler from "./api/catalog/index";
import ordersHandler from "./api/orders/index";
import consentHandler from "./api/consent/index";
import adminHandler from "./api/admin/index";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Dynamic router / param-mapper helper to mock Vercel serverless request structure
  const routeParamConverter = (handler: Function) => {
    return async (req: any, res: any) => {
      req.query = { ...req.query, ...req.params };
      try {
        await handler(req, res);
      } catch (err: any) {
        console.error("API execution failure:", err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
        }
      }
    };
  };

  // Register API Dispatch Routes - Consolidated handlers
  app.all("/api/health", routeParamConverter(healthHandler));
  
  // FAQs - GET all, POST create/update, DELETE by id
  app.get("/api/faq", (req: any, res: any) => {
    req.query = { ...req.query, ...req.params };
    faqHandler(req, res);
  });
  app.post("/api/faq", (req: any, res: any) => {
    req.query = { ...req.query, ...req.params };
    faqHandler(req, res);
  });
  app.delete("/api/faq/:id", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id };
    faqHandler(req, res);
  });

  // Authentication - login, register, me, my-data
  app.post("/api/auth/login", (req: any, res: any) => {
    req.query = { ...req.query, action: "login" };
    authHandler(req, res);
  });
  app.post("/api/auth/register", (req: any, res: any) => {
    req.query = { ...req.query, action: "register" };
    authHandler(req, res);
  });
  app.get("/api/auth/me", (req: any, res: any) => {
    req.query = { ...req.query, action: "me" };
    authHandler(req, res);
  });
  app.get("/api/auth/my-data", (req: any, res: any) => {
    req.query = { ...req.query, action: "my-data" };
    authHandler(req, res);
  });

  // Consent management
  app.get("/api/consent", (req: any, res: any) => {
    req.query = { ...req.query };
    consentHandler(req, res);
  });
  app.patch("/api/consent/:purpose", (req: any, res: any) => {
    req.query = { ...req.query, purpose: req.params.purpose };
    consentHandler(req, res);
  });

  // Catalog - GET all, POST create, GET/PUT/DELETE by id
  app.get("/api/catalog", (req: any, res: any) => {
    catalogHandler(req, res);
  });
  app.post("/api/catalog", (req: any, res: any) => {
    catalogHandler(req, res);
  });
  app.get("/api/catalog/:id", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id };
    catalogHandler(req, res);
  });
  app.put("/api/catalog/:id", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id };
    catalogHandler(req, res);
  });
  app.delete("/api/catalog/:id", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id };
    catalogHandler(req, res);
  });

  // Orders - GET all, POST create, GET by id, POST payment
  app.get("/api/orders", (req: any, res: any) => {
    ordersHandler(req, res);
  });
  app.post("/api/orders", (req: any, res: any) => {
    ordersHandler(req, res);
  });
  app.get("/api/orders/:id", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id };
    ordersHandler(req, res);
  });
  app.post("/api/orders/:id/payment", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id, action: "payment" };
    ordersHandler(req, res);
  });

  // Admin routes - retailers, orders, anonymize
  app.get("/api/admin/retailers", (req: any, res: any) => {
    adminHandler(req, res);
  });
  app.patch("/api/admin/retailers/:id", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id };
    adminHandler(req, res);
  });
  app.post("/api/admin/orders", (req: any, res: any) => {
    req.query = { ...req.query, action: "orders" };
    adminHandler(req, res);
  });
  app.patch("/api/admin/orders/:id", (req: any, res: any) => {
    req.query = { ...req.query, id: req.params.id, action: "orders" };
    adminHandler(req, res);
  });
  app.get("/api/admin/anonymize", (req: any, res: any) => {
    req.query = { ...req.query, action: "anonymize" };
    adminHandler(req, res);
  });
  app.post("/api/admin/anonymize", (req: any, res: any) => {
    req.query = { ...req.query, action: "anonymize" };
    adminHandler(req, res);
  });

  // Serve static assets or mount Vite dev server middleware
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
