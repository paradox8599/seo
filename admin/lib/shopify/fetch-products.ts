import { type Context } from ".keystone/types";
import { getProducts } from "./graphql";
import { PrismaClient } from "@prisma/client";

type ProductData = {
  id: string;
  title: string | null;
  status: string | null;
  seo: { title: string | null; description: string | null };
  productCategory: {
    productTaxonomyNode: { fullName: string };
  } | null;
};

export async function fetchAllProducts(
  storeIdentifier: string,
  context: Context,
) {
  try {
    const prisma = context.prisma as PrismaClient;
    // query store info by provided store id
    const stores = (await context.query.Store.findMany({
      where: {
        OR: [
          { id: { equals: storeIdentifier } },
          { name: { equals: storeIdentifier } },
        ],
      },
      query: "id name adminAccessToken version",
    })) as unknown as {
      id: string;
      name: string;
      adminAccessToken: string;
      version: number;
    }[];

    if (stores.length !== 1) {
      console.log(stores);
      throw new Error("store not found");
    }
    const store = stores[0];

    // fetch shopify products
    console.log("start fetching");

    const products: ProductData[] = [];
    let after: string | undefined | null;
    while (after !== null) {
      console.log("fetching after:", after);
      const data = await getProducts({
        store: store.name,
        adminAccessToken: store.adminAccessToken,
        first: 250,
        after,
      });
      if (data?.data?.errors || !data?.data?.products) {
        throw new Error(JSON.stringify(data?.data?.errors));
      }
      after = data.data.products.pageInfo.endCursor;

      const pageProducts = data.data.products.edges.map(
        (e: { node: ProductData }) => e.node,
      );

      products.push(...pageProducts);
      console.log("hasNextPage:", data.data.products?.pageInfo?.hasNextPage);
      if (!data.data.products?.pageInfo?.hasNextPage) break;
    }

    if (products.length === 0) {
      return;
    }
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

    await prisma.product.deleteMany({
      where: { store: { id: { equals: store.id } } },
    });

    // upsert
    await prisma.store.update({
      where: { id: store.id },
      data: {
        products: {
          upsert: [
            ...updateProducts.map((p) => {
              const data = {
                shopifyId: p.id,
                title: p.title ?? "",
                category:
                  p.productCategory?.productTaxonomyNode?.fullName ?? "None",
                status: p.status ?? "",
                SEOTitle: p.seo.title ?? "",
                SEODescription: p.seo.description ?? "",
                raw: { ...p, dbId: undefined },
                version: store.version,
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

    return;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
