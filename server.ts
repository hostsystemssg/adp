import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Import all Vercel-compatible serverless api handlers
import healthHandler from "./api/health";
import faqHandler from "./api/faq/index";
import faqIdHandler from "./api/faq/[id]";
import registerHandler from "./api/auth/register";
import loginHandler from "./api/auth/login";
import meHandler from "./api/auth/me";
import myDataHandler from "./api/auth/my-data";
import catalogIndexHandler from "./api/catalog/index";
import catalogIdHandler from "./api/catalog/[id]";
import ordersIndexHandler from "./api/orders/index";
import ordersIdHandler from "./api/orders/[id]";
import ordersPaymentHandler from "./api/orders/[id]/payment";
import consentIndexHandler from "./api/consent/index";
import consentPurposeHandler from "./api/consent/[purpose]";
import adminRetailersIndexHandler from "./api/admin/retailers/index";
import adminRetailersIdHandler from "./api/admin/retailers/[id]";
import adminOrdersIndexHandler from "./api/admin/orders/index";
import adminOrdersIdHandler from "./api/admin/orders/[id]";
import adminAnonymizeHandler from "./api/admin/anonymize";

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

  // Register API Dispatch Lines
  app.all("/api/health", routeParamConverter(healthHandler));
  
  // FAQs
  app.get("/api/faq", routeParamConverter(faqHandler));
  app.post("/api/faq", routeParamConverter(faqHandler));
  app.delete("/api/faq/:id", routeParamConverter(faqIdHandler));

  // Authentication & Registrations
  app.post("/api/auth/register", routeParamConverter(registerHandler));
  app.post("/api/auth/login", routeParamConverter(loginHandler));
  app.get("/api/auth/me", routeParamConverter(meHandler));
  
  // Custom compliance features
  app.get("/api/auth/my-data", routeParamConverter(myDataHandler));
  app.get("/api/consent", routeParamConverter(consentIndexHandler));
  app.patch("/api/consent/:purpose", routeParamConverter(consentPurposeHandler));

  // Catalog item specs
  app.get("/api/catalog", routeParamConverter(catalogIndexHandler));
  app.post("/api/catalog", routeParamConverter(catalogIndexHandler));
  app.get("/api/catalog/:id", routeParamConverter(catalogIdHandler));
  app.put("/api/catalog/:id", routeParamConverter(catalogIdHandler));
  app.delete("/api/catalog/:id", routeParamConverter(catalogIdHandler));

  // Regular distributor orders
  app.get("/api/orders", routeParamConverter(ordersIndexHandler));
  app.post("/api/orders", routeParamConverter(ordersIndexHandler));
  app.get("/api/orders/:id", routeParamConverter(ordersIdHandler));
  app.post("/api/orders/:id/payment", routeParamConverter(ordersPaymentHandler));

  // Admin Controls (applications verification and orders override lines)
  app.get("/api/admin/retailers", routeParamConverter(adminRetailersIndexHandler));
  app.patch("/api/admin/retailers/:id", routeParamConverter(adminRetailersIdHandler));
  app.post("/api/admin/orders", routeParamConverter(adminOrdersIndexHandler));
  app.patch("/api/admin/orders/:id", routeParamConverter(adminOrdersIdHandler));
  app.get("/api/admin/anonymize", routeParamConverter(adminAnonymizeHandler));
  app.post("/api/admin/anonymize", routeParamConverter(adminAnonymizeHandler));

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
