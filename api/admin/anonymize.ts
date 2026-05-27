import { VercelDb } from "../../src/db/dbStore";
import { authenticateUser, requireAdminUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  const user = await authenticateUser(req, res);
  if (!user) return;
  if (!requireAdminUser(req, res)) return;

  if (req.method === "GET") {
    try {
      const users = (await VercelDb.getUsers()).filter(u => u.role !== "admin" && !u.isAnonymized);
      const orders = await VercelDb.getOrders();

      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);

      const dormantAccounts = [];
      for (const u of users) {
        const ret = await VercelDb.findRetailerByUserId(u.id);
        const lastActivityDate = new Date(u.createdAt);
        let isDormant = false;

        if (ret) {
          const retOrders = orders.filter(o => o.retailerId === ret.id);
          if (retOrders.length > 0) {
            const latestOrderDate = new Date(Math.max(...retOrders.map(o => new Date(o.createdAt).getTime())));
            isDormant = latestOrderDate < cutoff;
          } else {
            isDormant = lastActivityDate < cutoff;
          }
        } else {
          isDormant = lastActivityDate < cutoff;
        }

        if (isDormant) {
          dormantAccounts.push({ id: u.id, email: u.email, name: u.fullName, registeredAt: u.createdAt });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          dormantCount: dormantAccounts.length,
          dormantUsers: dormantAccounts
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to collect data retention metrics" });
    }
  }

  if (req.method === "POST") {
    try {
      const users = (await VercelDb.getUsers()).filter(u => u.role !== "admin" && !u.isAnonymized);
      const orders = await VercelDb.getOrders();

      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);

      let anonymizedCounter = 0;

      for (const u of users) {
        const ret = await VercelDb.findRetailerByUserId(u.id);
        const lastActivityDate = new Date(u.createdAt);
        let isDormant = false;

        if (ret) {
          const retOrders = orders.filter(o => o.retailerId === ret.id);
          if (retOrders.length > 0) {
            const latestOrderDate = new Date(Math.max(...retOrders.map(o => new Date(o.createdAt).getTime())));
            isDormant = latestOrderDate < cutoff;
          } else {
            isDormant = lastActivityDate < cutoff;
          }
        } else {
          isDormant = lastActivityDate < cutoff;
        }

        if (isDormant) {
          u.fullName = "[REDACTED VENDOR]";
          u.email = `anonymized-${u.id}@redacted-portal.one`;
          u.phone = "+65 REDACTED";
          u.passwordHash = "REDACTED";
          u.isAnonymized = true;
          u.updatedAt = new Date().toISOString();
          await VercelDb.saveUser(u);

          if (ret) {
            ret.companyName = "[REDACTED ENTERPRISE]";
            ret.uen = "REDACTED";
            ret.address = "REDACTED, Singapore";
            ret.postalCode = "000000";
            ret.showroomLocations = "REDACTED";
            await VercelDb.saveRetailer(ret);
          }

          anonymizedCounter++;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Anonymisation sequence complete. ${anonymizedCounter} dormant account(s) redacted per PDPA standards.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Data retention cleaning workflow failed" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
