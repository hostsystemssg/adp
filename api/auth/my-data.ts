import { VercelDb } from "../../src/db/dbStore";
import { authenticateUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;

  try {
    const dbUsers = await VercelDb.getUsers();
    const dbRetailers = await VercelDb.getRetailers();
    const dbConsents = await VercelDb.getConsentRecords();
    const dbOrders = await VercelDb.getOrders();

    const myId = user.id;
    const userObj = dbUsers.find(u => u.id === myId);
    const retObj = dbRetailers.find(r => r.userId === myId);
    const consentsObj = dbConsents.filter(c => c.userId === myId);
    const ordersObj = retObj ? dbOrders.filter(o => o.retailerId === retObj.id) : [];

    return res.status(200).json({
      success: true,
      data: {
        userRecord: {
          fullName: userObj?.fullName,
          email: userObj?.email,
          phone: userObj?.phone,
          createdAt: userObj?.createdAt
        },
        corporateProfile: retObj ? {
          companyName: retObj.companyName,
          uen: retObj.uen,
          address: retObj.address,
          postalCode: retObj.postalCode,
          showroomLocations: retObj.showroomLocations,
          tier: retObj.tier,
          status: retObj.status
        } : null,
        pdpConsentHistory: consentsObj.map(c => ({
          purpose: c.purpose,
          givenAt: c.givenAt,
          withdrawnAt: c.withdrawnAt,
          loggedIp: c.ipAddress,
          browser: c.userAgent
        })),
        procurementHistory: ordersObj.map(o => ({
          orderId: o.id,
          totalPriceSingaporeDollars: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt
        }))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to package user dataset" });
  }
}
