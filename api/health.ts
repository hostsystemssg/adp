import { VercelDb } from "../src/db/dbStore";

export default async function handler(req: any, res: any) {
  res.status(200).json({ success: true, message: "Point One Technology Enterprise API Online" });
}
