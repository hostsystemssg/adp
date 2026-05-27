import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Import all Vercel-compatible serverless api handlers
import healthHandler from "./api/health";

// FAQ - consolidated route
import faqAllHandler from "./api/faq/[...all]";

// Auth - consolidated route (imports logic from helper files)
import authAllHandler from "./api/auth/[...all]";

// Catalog - consolidated route
import catalogAllHandler from "./api/catalog/[...all]";

// Orders - consolidated route
import ordersAllHandler from "./api/orders/[...all]";

// Consent - consolidated route
import consentAllHandler from "./api/consent/[...all]";

// Admin - consolidated route
import adminAllHandler from "./api/admin/[...all]";

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
  
  // FAQs - consolidated
  app.all("/api/faq", routeParamConverter(faqAllHandler));
  app.all("/api/faq/:id", routeParamConverter(faqAllHandler));

  // Authentication & Registrations - consolidated
  app.all("/api/auth/register", routeParamConverter(authAllHandler));
  app.all("/api/auth/login", routeParamConverter(authAllHandler));
  app.all("/api/auth/me", routeParamConverter(authAllHandler));
  app.all("/api/auth/my-data", routeParamConverter(authAllHandler));
  
  // Custom compliance features - consolidated
  app.all("/api/consent", routeParamConverter(consentAllHandler));
  app.all("/api/consent/:purpose", routeParamConverter(consentAllHandler));

  // Catalog item specs - consolidated
  app.all("/api/catalog", routeParamConverter(catalogAllHandler));
  app.all("/api/catalog/:id", routeParamConverter(catalogAllHandler));

  // Regular distributor orders - consolidated
  app.all("/api/orders", routeParamConverter(ordersAllHandler));
  app.all("/api/orders/:id", routeParamConverter(ordersAllHandler));
  app.all("/api/orders/:id/payment", routeParamConverter(ordersAllHandler));

  // Admin Controls (applications verification and orders override lines) - consolidated
  app.all("/api/admin/retailers", routeParamConverter(adminAllHandler));
  app.all("/api/admin/retailers/:id", routeParamConverter(adminAllHandler));
  app.all("/api/admin/orders", routeParamConverter(adminAllHandler));
  app.all("/api/admin/orders/:id", routeParamConverter(adminAllHandler));
  app.all("/api/admin/anonymize", routeParamConverter(adminAllHandler));

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
