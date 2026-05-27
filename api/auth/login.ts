import { VercelDb } from "../../src/db/dbStore";
import { LoginSchema } from "../../src/lib/validators";
import { signJWT } from "../../src/lib/jwt";
import bcrypt from "bcryptjs";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

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
    let tokenPayload: any = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

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
      data: {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        retailer,
        token
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Login authentication failed" });
  }
}
