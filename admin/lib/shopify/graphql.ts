import { Moment } from "moment";
import { SHOPIFY_API_VERSION } from "../../../src/lib/variables";
import { ProductData } from "./fetch-products";

const throttles: { [store: string]: number } = {};

let throttleAddup: NodeJS.Timeout | undefined;

function setThrottle(store: string, throttle: number) {
  throttles[store] = throttle;
}

function getThrottle(store: string) {
  throttles[store] ??= 2000;
  return throttles[store];
}

export async function shopifyGQL<T>({
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
  if (throttleAddup === void 0) {
    throttleAddup = setInterval(() => {
      for (const store of Object.keys(throttles)) {
        throttles[store] = Math.min(throttles[store] + 100, 2000);
      }
    }, 1000);
  }
  while (getThrottle(store) < 1200) {
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
    data: { errors: unknown } & T;
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
  const throttle =
    data.extensions?.cost.throttleStatus.currentlyAvailable ?? 2000;
  setThrottle(store, throttle);
  return data;
}

export async function getProducts({
  store,
  adminAccessToken,
  first = 250,
  after,
}: {
  store: string;
  adminAccessToken: string;
  first?: number;
  after?: string;
}) {
  return await shopifyGQL<{
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: { node: ProductData }[];
    };
  }>({
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
              collections(first: 250) {
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

export type Order = {
  createdAt: string;
  billingAddress: {
    countryCodeV2: string | null;
    provinceCode: string | null;
  } | null;
  customerJourneySummary: {
    customerOrderIndex: number | null;
    daysToConversion: number | null;
    momentsCount: number | null;
    firstVisit: { source: string | null } | null;
  } | null;
};

export async function getOrders({
  store,
  adminAccessToken,
  first = 250,
  after,
  from,
  to,
}: {
  store: string;
  adminAccessToken: string;
  first?: number;
  after?: string;
  from: Moment;
  to: Moment;
}) {
  return await shopifyGQL<{
    orders: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: { node: Order }[];
    };
  }>({
    store,
    adminAccessToken,
    query: /* GraphQL */ `
      query OrderSummary($first: Int!, $after: String) {
        orders(
          first: $first
          after: $after
          sortKey: CREATED_AT
          reverse: true
          query: "created_at:>'${from.toISOString()}' AND created_at:<'${to.toISOString()}'"
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              createdAt
              billingAddress {
                countryCodeV2
                provinceCode
              }
              customerJourneySummary {
                customerOrderIndex
                daysToConversion
                momentsCount
                firstVisit {
                  source
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
