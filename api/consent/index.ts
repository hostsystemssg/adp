import { VercelDb, ConsentRecord } from "../../src/db/dbStore";
import { ConsentPatchSchema } from "../../src/lib/validators";
import { authenticateUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  const user = await authenticateUser(req, res);
  if (!user) return;

  const { purpose, action } = req.query;

  // Handle GET /api/consent - list user's consent records
  if (req.method === "GET") {
    try {
      const consents = (await VercelDb.getConsentRecords()).filter(c => c.userId === user.id);
      return res.status(200).json({ success: true, data: consents });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to pull consent profiles" });
    }
  }

  // Handle PATCH /api/consent?purpose=xxx - modify consent for specific purpose
  if (req.method === "PATCH" && purpose) {
    try {
      const parsed = ConsentPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Request payload contains validation errors" });
      }

      const records = await VercelDb.getConsentRecords();
      const record = records.find(c => c.userId === user.id && c.purpose === purpose && c.withdrawnAt === null);

      let impactStatement = "";
      if (purpose === "registration") {
        impactStatement = "CRITICAL WARNING: Withdrawing consent for account registration forces Point One Technology to deactivate and suspend your B2B account access, terminating any open pre-order lines per the PDPA Purpose Limitation guidelines.";
      } else if (purpose === "marketing") {
        impactStatement = "Notice: Withdrawing consent for wholesale promotions disables all upcoming pre-order catalog launches and volume tier rebate distributions.";
      } else {
        impactStatement = "Notice: Anonymized analytics cookie access disabled.";
      }

      const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "Agent";

      if (parsed.data.withdrawn) {
        if (record) {
          record.withdrawnAt = new Date().toISOString();
          await VercelDb.saveConsentRecord(record);
        } else {
          const newRec: ConsentRecord = {
            id: "con-" + Math.random().toString(36).substr(2, 9),
            userId: user.id,
            purpose: purpose as any,
            givenAt: new Date().toISOString(),
            withdrawnAt: new Date().toISOString(),
            ipAddress: String(ipAddress).split(",")[0].trim(),
            userAgent
          };
          await VercelDb.saveConsentRecord(newRec);
        }

        if (purpose === "registration") {
          const ret = await VercelDb.findRetailerByUserId(user.id);
          if (ret) {
            ret.status = "Pending"; 
            await VercelDb.saveRetailer(ret);
          }
        }
      } else {
        const matched = records.find(c => c.userId === user.id && c.purpose === purpose);
        if (matched) {
          matched.withdrawnAt = null;
          await VercelDb.saveConsentRecord(matched);
        } else {
          const newRec: ConsentRecord = {
            id: "con-" + Math.random().toString(36).substr(2, 9),
            userId: user.id,
            purpose: purpose as any,
            givenAt: new Date().toISOString(),
            withdrawnAt: null,
            ipAddress: String(ipAddress).split(",")[0].trim(),
            userAgent
          };
          await VercelDb.saveConsentRecord(newRec);
        }
        
        if (purpose === "registration") {
          const ret = await VercelDb.findRetailerByUserId(user.id);
          if (ret) {
            ret.status = "Approved"; 
            await VercelDb.saveRetailer(ret);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Consent state modified",
        data: {
          purpose,
          withdrawn: parsed.data.withdrawn,
          notice: impactStatement
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to modify PDPA consent parameters" });
    }
  }

  return res.status(400).json({ success: false, error: "Invalid consent action" });
}
