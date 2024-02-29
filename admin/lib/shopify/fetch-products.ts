import { type Context } from ".keystone/types";
import { getProducts } from "./graphql";
import { PrismaClient } from "@prisma/client";

type ProductData = {
  id: string;
  title: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  seo: { title: string | null; description: string | null };
  collections: { edges: { node: { title: string } }[] };
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

    // delete all products in store
    console.log(`Deleting all products in store ${store.name}`);
    await prisma.product.deleteMany({
      where: { store: { id: { equals: store.id } } },
    });
    // delete empty collections
    console.log("Deleting empty collections");
    await prisma.collection.deleteMany({
      where: { products: { none: { shopifyId: { startsWith: "gid" } } } },
    });
    // add new collections
    const colNames = products.reduce((arr, p) => {
      arr.push(...p.collections.edges.map((e) => e.node.title));
      return arr;
    }, [] as string[]);
    const colNameSet = Array.from(new Set(colNames));
    console.log("Creating collections");
    await context.sudo().query.Collection.createMany({
      data: colNameSet.map((c) => ({
        name: c,
        store: { connect: { id: store.id } },
      })),
    });
    console.log("Getting colletions db info");
    const colsData = (await context.sudo().query.Collection.findMany({
      where: { store: { id: { equals: store.id } } },
      query: "id name",
    })) as unknown as { id: string; name: string }[];
    // add products
    const connectedProducts = products.map((p) => ({
      ...p,
      cols: p.collections.edges.map((e) => {
        const col = colsData.find((c) => c.name === e.node.title);
        if (!col) throw "collection expected";
        return col;
      }),
    }));
    console.log("Creating products");
    await context.sudo().query.Product.createMany({
      data: connectedProducts.map((p) => ({
        shopifyId: p.id,
        productUpdatedAt: p.updatedAt,
        productCreatedAt: p.createdAt,
        title: p.title ?? "",
        store: { connect: { id: store.id } },
        category: p.productCategory?.productTaxonomyNode?.fullName ?? "None",
        collections: { connect: p.cols.map((c) => ({ id: c.id })) },
        status: p.status ?? "",
        SEOTitle: p.seo.title ?? "",
        SEODescription: p.seo.description ?? "",
        version: store.version,
      })),
    });

    console.log("Finished fetching");
    return;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
