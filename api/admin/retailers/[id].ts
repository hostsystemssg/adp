import { VercelDb } from "../../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;
  if (!requireAdminUser(req, res)) return;

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, error: "Retailer identifier is required" });
  }

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
