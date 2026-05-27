import { VercelDb, User, Retailer, ConsentRecord } from "../../src/db/dbStore";
import { RegisterSchema } from "../../src/lib/validators";
import { signJWT } from "../../src/lib/jwt";
import bcrypt from "bcryptjs";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorDetail = parsed.error.issues.map(i => i.message).join(", ");
      return res.status(400).json({ success: false, error: errorDetail });
    }

    const { email, password, fullName, phone, companyName, uen, address, postalCode, showroomLocations } = parsed.data;

    // Check existing email
    const users = await VercelDb.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: "This corporate email address is already registered" });
    }

    // Check existing UEN
    const retailers = await VercelDb.getRetailers();
    if (retailers.some(r => r.uen.toLowerCase() === uen.toLowerCase())) {
      return res.status(400).json({ success: false, error: "A corporate retailer with this UEN is already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = "u-" + Math.random().toString(36).substr(2, 9);
    const retailerId = "ret-" + Math.random().toString(36).substr(2, 9);

    const newUser: User = {
      id: userId,
      email,
      passwordHash,
      fullName,
      phone,
      role: "retailer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAnonymized: false
    };
    await VercelDb.saveUser(newUser);

    const newRetailer: Retailer = {
      id: retailerId,
      userId,
      companyName,
      uen,
      address,
      postalCode,
      showroomLocations,
      tier: "Standard",
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await VercelDb.saveRetailer(newRetailer);

    // Consent
    const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown B2B Browser";

    const newConsent: ConsentRecord = {
      id: "con-" + Math.random().toString(36).substr(2, 9),
      userId,
      purpose: "registration",
      givenAt: new Date().toISOString(),
      withdrawnAt: null,
      ipAddress: String(ipAddress).split(",")[0].trim(),
      userAgent
    };
    await VercelDb.saveConsentRecord(newConsent);

    const token = await signJWT({
      userId,
      email,
      role: "retailer",
      retailerId,
      companyName,
      tier: "Standard"
    });

    return res.status(200).json({
      success: true,
      data: {
        user: { id: userId, email, fullName, role: "retailer" },
        retailer: newRetailer,
        token
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to complete registration" });
  }
}
