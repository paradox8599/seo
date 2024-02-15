import { SHOPIFY_API_VERSION } from "../../../src/lib/variables";
import { ShopifyProduct } from "../../types/task";

export async function shopifyGQL({
  store,
  adminAccessToken,
  query,
}: {
  store: string;
  query: string;
  adminAccessToken: string;
}) {
  return await fetch(
    `https://${store}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminAccessToken,
      },
      body: JSON.stringify({ query }),
    },
  );
}

export async function getProducts({
  store,
  adminAccessToken,
  first,
  after,
}: {
  store: string;
  adminAccessToken: string;
  first: number;
  after?: string;
}) {
  return await shopifyGQL({
    store,
    adminAccessToken,
    query: /* GRAPHQL */ `
      query {
        products ( first: ${first}, after: ${after ? `"${after}"` : "null"} ) {
          pageInfo { endCursor hasNextPage }
          edges {
            node {
              id title status seo { title description }
              productCategory { productTaxonomyNode { fullName } }
            }
          }
        }
      }
    `
      .replaceAll(/\n/g, " ")
      .replaceAll(/\ +/g, " ")
      .trim(),
  });
}

export async function pushProduct({
  store,
  adminAccessToken,
  product,
}: {
  store: string;
  adminAccessToken: string;
  product: {
    shopifyId: string;
    SEOTitle: string;
    SEODescription: string;
  };
}) {
  return await shopifyGQL({
    store,
    adminAccessToken,
    query: /* GRAPHQL */ `
      mutation {
        productUpdate (
          input: {
            id: "${product.shopifyId}",
            seo: {
              title: "${product.SEOTitle}",
              description: "${product.SEODescription}"
            }
          }
        ) { product { id } }
      }
    `,
  });
}
