import { verifyJWT } from "../src/lib/jwt";
import { VercelDb } from "../src/db/dbStore";

export async function authenticateUser(req: any, res: any) {
  let token = "";
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else {
    const cookieHeader = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c: string) => {
        const parts = c.trim().split("=");
        return [parts[0], parts.slice(1).join("=")];
      })
    );
    token = cookies["token"] || "";
  }

  if (!token) {
    res.status(401).json({ success: false, error: "Access token is missing or expired" });
    return null;
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    res.status(401).json({ success: false, error: "Invalid premium security session token" });
    return null;
  }

  const users = await VercelDb.getUsers();
  const user = users.find(u => u.id === payload.userId);

  if (!user) {
    res.status(401).json({ success: false, error: "User session associated with this token no longer exists" });
    return null;
  }

  if (user.isAnonymized) {
    res.status(403).json({ success: false, error: "This account has been anonymized per customer request" });
    return null;
  }

  req.user = user;
  if (user.role === "retailer") {
    const retailer = await VercelDb.findRetailerByUserId(user.id);
    req.retailer = retailer;
  }
  return user;
}

export function requireAdminUser(req: any, res: any) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ success: false, error: "Privileged administrator permissions are required" });
    return false;
  }
  return true;
}
