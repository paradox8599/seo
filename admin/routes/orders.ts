import { NextApiRequest, NextApiResponse } from "next";
import { Context } from ".keystone/types";
import moment from "moment";
import { getOrdersFrom } from "../lib/shopify/fetch-orders";

export async function getOrdersSummaryAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  if (!context.session?.data?.email) {
    return res.status(401).json({ error: "Not logged in" });
  }

  // id
  if (!req.query.id) {
    return res.status(400).json({ error: "Missing param: (store) id" });
  }
  const id = req.query.id as string;

  // from date
  if (!req.query.from) {
    return res.status(400).json({ error: "Missing param: from (timestamp)" });
  }
  const from = moment(parseInt(req.query.from as string) * 1000);

  if (!from.isValid()) {
    return res.status(400).json({ error: "Invalid param: from (timestamp)" });
  }

  // to date
  const to = moment(
    req.query.to ? parseInt(req.query.to as string) * 1000 : "0",
  );
  if (!to.isValid()) {
    return res.status(400).json({ error: "Invalid param: to (timestamp)" });
  }

  try {
    // get store
    const store = (await context.sudo().query.Store.findOne({
      where: { id },
      query: "name adminAccessToken",
    })) as { name: string; adminAccessToken: string };
    // get orders summary data
    const orders = await getOrdersFrom({
      store: store.name,
      adminAccessToken: store.adminAccessToken,
      from,
      to,
    });

    res.json({ message: "ok", data: { orders } });
  } catch (e) {
    console.log(e);
    res.status(418).json({ error: e });
  }
}
