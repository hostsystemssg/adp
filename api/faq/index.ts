import { VercelDb } from "../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  const { id, action } = req.query;

  // Handle GET /api/faq - list all FAQs (public)
  if (req.method === "GET" && !id) {
    try {
      const faqs = await VercelDb.getFaqs();
      return res.status(200).json({ success: true, data: faqs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to read FAQ list" });
    }
  }

  // Handle POST /api/faq - create/update FAQ (admin only)
  if (req.method === "POST") {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;

    try {
      const { id, q, a } = req.body;
      if (!q || !a) {
        return res.status(400).json({ success: false, error: "Question and Answer fields are required" });
      }
      const faqId = id && id !== "new" ? id : "faq-" + Math.random().toString(36).substr(2, 9);
      const saved = await VercelDb.saveFaq({
        id: faqId,
        q: q.trim(),
        a: a.trim(),
        createdAt: new Date().toISOString()
      });
      return res.status(200).json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to save FAQ listing" });
    }
  }

  // Handle DELETE /api/faq?id=xxx - delete FAQ (admin only)
  if (req.method === "DELETE" && id) {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;

    try {
      const deleted = await VercelDb.deleteFaq(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "FAQ index not found in database" });
      }
      return res.status(200).json({ success: true, data: { status: "deleted", id } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to remove FAQ" });
    }
  }

  return res.status(400).json({ success: false, error: "Invalid FAQ action" });
}
