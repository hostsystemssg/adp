import { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb, FAQItem } from "../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParts = req.query.all as string[] || [];
  const id = pathParts[0];

  if (req.method === 'GET') {
    try {
      const faqs = await VercelDb.getFaqs();
      if (id) {
        const item = faqs.find(f => f.id === id);
        if (!item) return res.status(404).json({ success: false, error: "FAQ not found" });
        return res.status(200).json({ success: true, data: item });
      }
      return res.status(200).json({ success: true, data: faqs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to fetch FAQs" });
    }
  }

  if (req.method === 'POST') {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;
    try {
      const { q, a } = req.body;
      const newFaq: FAQItem = { id: "faq-" + Date.now(), q, a, createdAt: new Date().toISOString() };
      await VercelDb.saveFaq(newFaq);
      return res.status(201).json({ success: true, data: newFaq });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to create FAQ" });
    }
  }

  if (req.method === 'PUT' && id) {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;
    try {
      const { q, a } = req.body;
      const faqs = await VercelDb.getFaqs();
      const existing = faqs.find(f => f.id === id);
      if (!existing) return res.status(404).json({ success: false, error: "FAQ not found" });
      const updated: FAQItem = { ...existing, q, a };
      await VercelDb.saveFaq(updated);
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to update FAQ" });
    }
  }

  if (req.method === 'DELETE' && id) {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;
    try {
      const success = await VercelDb.deleteFaq(id);
      if (!success) return res.status(404).json({ success: false, error: "FAQ not found" });
      return res.status(200).json({ success: true, message: "FAQ deleted" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to delete FAQ" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
