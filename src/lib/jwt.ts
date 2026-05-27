import * as jose from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "pointone_super_secret_key_65_singapore_ceiling_fans";
const secret = new TextEncoder().encode(JWT_SECRET_STRING);

export interface JWTPayload {
  userId: string;
  email: string;
  role: "retailer" | "admin";
  retailerId?: string;
  companyName?: string;
  tier?: string;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  const jwt = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (err) {
    return null;
  }
}
