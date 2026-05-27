import { VercelDb } from "../../src/db/dbStore";
import { authenticateUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;

  try {
    const consents = (await VercelDb.getConsentRecords()).filter(c => c.userId === user.id);
    return res.status(200).json({ success: true, data: consents });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to pull consent profiles" });
  }
}
