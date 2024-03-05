import { SHOPIFY_API_VERSION } from "../../../src/lib/variables";

let throttle = 2000;

export async function shopifyGQL({
  store,
  adminAccessToken,
  query,
  variables,
}: {
  store: string;
  query: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  variables?: any;
  adminAccessToken: string;
}) {
  while (throttle < 1500) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const r = await fetch(
    `https://${store}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminAccessToken,
      },
      body: JSON.stringify({
        query: query
          .replace(/(\r\n|\n|\r|\t)/gm, " ")
          .replace(/ {2,}/g, " ")
          .trim(),
        variables,
      }),
    },
  );
  const data: {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    data: any;
    errors: string;
    extensions: {
      cost: {
        requestedQueryCost: number;
        actualQueryCost: number;
        throttleStatus: {
          maximumavailable: number;
          currentlyAvailable: number;
          restoreRate: number;
        };
      };
    };
  } = await r.json();
  console.log("data", data);
  throttle = data.extensions?.cost.throttleStatus.currentlyAvailable ?? 2000;
  return data;
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
    query: /* GraphQL */ `
      query Query($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            endCursor
            hasNextPage
          }
          edges {
            node {
              id
              title
              status
              createdAt
              updatedAt
              seo {
                title
                description
              }
              productCategory {
                productTaxonomyNode {
                  fullName
                }
              }
              collections(first: 100) {
                edges {
                  node {
                    title
                  }
                }
              }
            }
          }
        }
      }
    `,
    variables: { first, after },
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
    query: /* GraphQL */ `
      mutation Mutation($id: ID!, $title: String!, $description: String!) {
        productUpdate(
          input: { id: $id, seo: { title: $title, description: $description } }
        ) {
          product {
            id
          }
        }
      }
    `,
    variables: {
      id: product.shopifyId,
      title: product.SEOTitle,
      description: product.SEODescription,
    },
  });
}
