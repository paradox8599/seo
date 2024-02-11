import { SHOPIFY_API_VERSION } from "../../../src/lib/variables";

export async function shopifyGQL({
  store,
  adminAcessToken,
  query,
}: {
  store: string;
  query: string;
  adminAcessToken: string;
}) {
  return await fetch(
    `https://${store}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminAcessToken,
      },
      body: JSON.stringify({ query }),
    },
  );
}

export async function getProducts({
  store,
  adminAcessToken,
  first,
  after,
}: {
  store: string;
  adminAcessToken: string;
  first: number;
  after?: string;
}) {
  return await shopifyGQL({
    store,
    adminAcessToken,
    query: /* GRAPHQL */ `
      query {
        products ( first: ${first}, after: ${after ? `"${after}"` : "null"} ) {
          pageInfo { endCursor hasNextPage }
          edges { node {
            id title status seo { title description }
          } }
        }
      }
    `
      .replaceAll(/\n/g, " ")
      .replaceAll(/\ +/g, " ")
      .trim(),
  });
}
