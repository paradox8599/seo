import { NextApiRequest, NextApiResponse } from "next";
import { type Context } from ".keystone/types";

export async function retrySEOTaskAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  if (!context.session?.data?.email) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (!req.query.id) {
    return res.status(400).json({ error: "Missing param: task id" });
  }
  try {
    await context.query.SeoTask.updateOne({
      where: { id: req.query.id as string },
      data: { retry: true },
    });
    return res.json({ message: "ok" });
  } catch (e) {
    console.log(e);
    return res.status(418).json({ error: e });
  }
}
