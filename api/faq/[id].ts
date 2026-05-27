import { VercelDb } from "../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method === "DELETE") {
    const user = await authenticateUser(req, res);
    if (!user) return;
    if (!requireAdminUser(req, res)) return;

    try {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ success: false, error: "FAQ designation ID is required" });
      }
      const deleted = await VercelDb.deleteFaq(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "FAQ index not found in database" });
      }
      return res.status(200).json({ success: true, data: { status: "deleted", id } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to remove FAQ" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
