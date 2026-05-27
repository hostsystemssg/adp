import { VercelRequest, VercelResponse } from '@vercel/node';
import { VercelDb, User, Retailer, ConsentRecord } from "../../src/db/dbStore";
import { LoginSchema, RegisterSchema } from "../../src/lib/validators";
import { signJWT } from "../../src/lib/jwt";
import bcrypt from "bcryptjs";
import { authenticateUser } from "../authHelper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const pathParts = req.query.all as string[] || [];
  const action = pathParts[0];

  // LOGIN
  if (method === 'POST' && action === 'login') {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      }

      const { email, password } = parsed.data;
      const users = await VercelDb.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(401).json({ success: false, error: "Incorrect email credentials or password" });
      }

      if (user.isAnonymized) {
        return res.status(403).json({ success: false, error: "This account has been anonymized per customer request" });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, error: "Incorrect email credentials or password" });
      }

      let retailer: any = null;
      let tokenPayload: any = { userId: user.id, email: user.email, role: user.role };

      if (user.role === "retailer") {
        retailer = await VercelDb.findRetailerByUserId(user.id);
        if (!retailer) {
          return res.status(403).json({ success: false, error: "User account lacks active retailer record" });
        }
        tokenPayload.retailerId = retailer.id;
        tokenPayload.companyName = retailer.companyName;
        tokenPayload.tier = retailer.tier;
      }

      const token = await signJWT(tokenPayload);
      return res.status(200).json({
        success: true,
        data: { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, retailer, token }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Login authentication failed" });
    }
  }

  // REGISTER
  if (method === 'POST' && action === 'register') {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorDetail = parsed.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({ success: false, error: errorDetail });
      }

      const { email, password, fullName, phone, companyName, uen, address, postalCode, showroomLocations } = parsed.data;

      const users = await VercelDb.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ success: false, error: "This corporate email address is already registered" });
      }

      const retailers = await VercelDb.getRetailers();
      if (retailers.some(r => r.uen.toLowerCase() === uen.toLowerCase())) {
        return res.status(400).json({ success: false, error: "A corporate retailer with this UEN is already registered" });
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = "u-" + Math.random().toString(36).substr(2, 9);
      const retailerId = "ret-" + Math.random().toString(36).substr(2, 9);

      const newUser: User = {
        id: userId, email, passwordHash, fullName, phone, role: "retailer",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isAnonymized: false
      };
      await VercelDb.saveUser(newUser);

      const newRetailer: Retailer = {
        id: retailerId, userId, companyName, uen, address, postalCode, showroomLocations,
        tier: "Standard", status: "Pending",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      await VercelDb.saveRetailer(newRetailer);

      const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "Unknown B2B Browser";

      const newConsent: ConsentRecord = {
        id: "con-" + Math.random().toString(36).substr(2, 9),
        userId, purpose: "registration", givenAt: new Date().toISOString(), withdrawnAt: null,
        ipAddress: String(ipAddress).split(",")[0].trim(), userAgent
      };
      await VercelDb.saveConsentRecord(newConsent);

      const token = await signJWT({ userId, email, role: "retailer", retailerId, companyName, tier: "Standard" });
      return res.status(200).json({
        success: true,
        data: { user: { id: userId, email, fullName, role: "retailer" }, retailer: newRetailer, token }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to complete registration" });
    }
  }

  // ME
  if (method === 'GET' && action === 'me') {
    const user = await authenticateUser(req, res);
    if (!user) return;
    return res.status(200).json({
      success: true,
      data: { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, retailer: (req as any).retailer || null }
    });
  }

  // MY-DATA
  if (method === 'GET' && action === 'my-data') {
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
          userRecord: { fullName: userObj?.fullName, email: userObj?.email, phone: userObj?.phone, createdAt: userObj?.createdAt },
          corporateProfile: retObj ? {
            companyName: retObj.companyName, uen: retObj.uen, address: retObj.address,
            postalCode: retObj.postalCode, showroomLocations: retObj.showroomLocations,
            tier: retObj.tier, status: retObj.status
          } : null,
          pdpConsentHistory: consentsObj.map(c => ({
            purpose: c.purpose, givenAt: c.givenAt, withdrawnAt: c.withdrawnAt,
            loggedIp: c.ipAddress, browser: c.userAgent
          })),
          procurementHistory: ordersObj.map(o => ({
            orderId: o.id, totalPriceSingaporeDollars: o.totalAmount, status: o.status, createdAt: o.createdAt
          }))
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to package user dataset" });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
