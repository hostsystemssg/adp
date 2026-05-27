import { authenticateUser } from "../authHelper";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await authenticateUser(req, res);
  if (!user) return;

  return res.status(200).json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      retailer: req.retailer || null
    }
  });
}
