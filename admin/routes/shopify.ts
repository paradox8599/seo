import { NextApiRequest, NextApiResponse } from "next";
import { type Context } from ".keystone/types";
import { fetchAllProducts } from "../lib/shopify/fetch-products";
import { pushProduct } from "../lib/shopify/graphql";

export async function fetchAllProductsAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  if (!context.session?.data?.email) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (!req.query.id && !req.query.store) {
    return res.status(400).json({ error: "Missing param: store name | id" });
  }
  try {
    await fetchAllProducts(
      (req.query.id as string) ?? (req.query.store as string),
      context,
    );
    return res.json({ message: "ok" });
  } catch (e) {
    console.log(e);
    return res.status(418).json({ error: e });
  }
}
export async function pushProductAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  if (!context.session?.data?.email) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (!req.query.id) {
    return res.status(400).json({ error: "Missing param: product id" });
  }
  try {
    const prod = (await context.query.Product.findOne({
      where: { id: req.query.id as string },
      query:
        "shopifyId SEOTitle SEODescription store { name adminAccessToken }",
    })) as {
      shopifyId: string;
      SEOTitle: string;
      SEODescription: string;
      store: { name: string; adminAccessToken: string };
    };
    const r = await pushProduct({
      store: prod.store.name,
      adminAccessToken: prod.store.adminAccessToken,
      product: prod,
    });
    console.log(await r.json());
    return res.json({ message: "ok" });
  } catch (e) {
    console.log(e);
    return res.status(418).json({ error: e });
  }
}
