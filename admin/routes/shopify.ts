import { NextApiRequest, NextApiResponse } from "next";
import { type Context } from ".keystone/types";
import { getProducts } from "../lib/shopify/graphql";
import { PrismaClient } from "@prisma/client";

type ProductData = {
  id: string;
  title: string | null;
  status: string | null;
  seo: { title: string | null; description: string | null };
};

export async function fetchAllProducts(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  // if (!context.session?.data?.email) {
  //   return res.status(401).json({ error: "Not logged in" });
  // }
  if (!req.query.id && !req.query.store) {
    return res.status(400).json({ error: "Missing param: store name | id" });
  }
  try {
    const prisma = context.prisma as PrismaClient;
    // query store info by provided store id
    const stores = (await context.query.Store.findMany({
      where: {
        OR: [
          { id: { equals: req.query.id as string } },
          { name: { equals: req.query.store as string } },
        ],
      },
      query: "name adminAccessToken",
    })) as unknown as {
      name: string;
      adminAccessToken: string;
    }[];

    if (stores.length !== 1) {
      console.log(stores);
      return res.status(404).json({ error: "Store not found" });
    }
    const store = stores[0];

    // fetch shopify products
    console.log("start fetching");

    const products: ProductData[] = [];
    let after: string | undefined | null;
    while (after !== null) {
      console.log("fetching after:", after);
      const resp = await getProducts({
        store: store.name,
        adminAcessToken: store.adminAccessToken,
        first: 250,
        after,
      });
      const data = await resp.json();
      if (data?.data?.errors || !data?.data?.products) {
        return res.status(500).json({ data });
      }
      after = data.data.products.pageInfo.endCursor;

      const pageProducts = data.data.products.edges.map(
        (e: { node: ProductData }) => e.node,
      );

      products.push(...pageProducts);
      console.log("hasNextPage:", data.data.products?.pageInfo?.hasNextPage);
      if (!data.data.products?.pageInfo?.hasNextPage) break;
    }

    if (products.length === 0) return res.status(200).json({});
    console.log("start upserting");

    // get item ids for existing products
    const old = (await context.query.Product.findMany({
      where: { shopifyId: { in: products.map((p) => p.id) } },
      query: "id shopifyId",
    })) as unknown as { id: string; shopifyId: string }[];

    const updateProducts = products.map((p) => {
      return {
        ...p,
        dbId: old.find((o) => o.shopifyId === p.id)?.id ?? p.id,
      };
    });

    // upsert
    await prisma.store.update({
      where: { id: req.query.id as string },
      data: {
        products: {
          upsert: [
            ...updateProducts.map((p) => {
              const data = {
                shopifyId: p.id,
                title: p.title ?? "",
                status: p.status ?? "",
                SEOTitle: p.seo.title ?? "",
                SEODescription: p.seo.description ?? "",
              };
              return {
                create: data,
                update: data,
                where: { id: p.dbId },
              };
            }),
          ],
        },
      },
    });
    console.log("finished upserting, return");

    return res.status(200).json({ message: "ok" });
  } catch (e) {
    console.log(e);
    return res.status(404).json({ error: e });
  }
}
