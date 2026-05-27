import { VercelDb } from "../../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;
  if (!requireAdminUser(req, res)) return;

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
