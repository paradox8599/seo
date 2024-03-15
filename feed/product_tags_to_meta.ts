/**
 * This script is used to convert product tags to metafields
 * tags format: FieldKey_Value
 * the script find tags with keys in metafields,
 * convert them into metafields format,
 * and update products' metafields
 */

import { shopifyGQL } from "../admin/lib/shopify/graphql";
import fs from "fs";

const STORE_NAME = "";
const ADMIN_ACCESS_TOKEN = "";

type ProductData = {
  id: string;
  tags: string[];
  metafields: {
    edges: {
      node: {
        namespace: "custom";
        key: string;
        id: string;
        type: "single_line_text_field";
      };
    }[];
  };
};

const tagMaps = [
  {
    list: true,
    tag: "Color",
    field: "colour",
  },
  {
    list: false,
    tag: "Labels Per Roll / Pack",
    field: "labels_per_roll_pack",
  },
  {
    list: false,
    tag: "Label Adhesive",
    field: "label_adhesive",
  },
  {
    list: false,
    tag: "Core Size",
    field: "core_size",
  },
  {
    list: true,
    tag: "Printer",
    field: "canon_printer_model",
  },
  {
    list: false,
    tag: "Groups",
    field: "group",
  },
  {
    list: false,
    tag: "Material",
    field: "label_material",
  },
];

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function gql({ query, variables }: { query: string; variables?: any }) {
  return await shopifyGQL({
    store: STORE_NAME,
    adminAccessToken: ADMIN_ACCESS_TOKEN,
    query,
    variables,
  });
}

async function getProductTags({
  first,
  after,
}: {
  first: number;
  after?: string;
}) {
  return await gql({
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
              tags
              metafields(first: 250, namespace: "custom") {
                edges {
                  node {
                    id
                    key
                    value
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

async function getAllProducts() {
  let after: string | undefined | null;
  const products: ProductData[] = [];
  while (after !== null) {
    console.log("fetching after:", after);
    const data = await getProductTags({
      first: 250,
      after,
    });
    if (data?.errors || data?.data?.errors || !data?.data?.products) {
      throw JSON.stringify(data?.errors ?? data?.data?.errors);
    }

    const pageProducts = data.data.products.edges.map(
      (e: { node: ProductData }) => e.node,
    );
    products.push(...pageProducts);
    if (!data.data.products?.pageInfo?.hasNextPage) break;
    after = data.data.products.pageInfo.endCursor;
  }
  return products;
}

async function deleteMetafield({ id }: { id: string }) {
  return await gql({
    query: /* GraphQL */ `
      mutation metafieldDelete($input: MetafieldDeleteInput!) {
        metafieldDelete(input: $input) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: { input: { id } },
  });
}
async function createMetafields({
  id,
  metafields,
}: {
  id: string;
  metafields: { key: string; value: string }[];
}) {
  return await gql({
    query: /* GraphQL */ `
      mutation Mutation($id: ID!, $fields: [MetafieldInput!]!) {
        productUpdate(input: { id: $id, metafields: $fields }) {
          product {
            id
          }
        }
      }
    `,
    variables: {
      id,
      fields: metafields.map((f) => ({
        ...f,
        namespace: "custom",
        type: f.value.startsWith("[")
          ? "list.single_line_text_field"
          : "single_line_text_field",
      })),
    },
  });
}

async function main() {
  const REQ_SIZE = 3;
  const products = await getAllProducts();
  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
  console.log("products fetched:", products.length);

  // const productsData = fs.readFileSync("products.json", { encoding: "utf8" });
  // const products: ProductData[] = JSON.parse(productsData);
  //
  // Delete all existing metafields
  console.log("deleting existing metafields");
  const fieldIds = products.flatMap((p) =>
    p.metafields.edges.map((e) => e.node.id),
  );

  for (let i = 0; i < fieldIds.length; i += REQ_SIZE) {
    console.log(
      `Deleting metafield ${i + 1} - ${i + REQ_SIZE + 1}/${fieldIds.length}`,
    );
    const ids = fieldIds.slice(i, i + REQ_SIZE);
    const data = await Promise.all(ids.map((id) => deleteMetafield({ id })));
    console.log(
      "available:",
      data[0].extensions.cost.throttleStatus.currentlyAvailable,
    );
  }
  // create new metafields

  console.log("creating new metafields");
  function convertTagsToValues(
    data: { list: boolean; key: string; value: string }[],
  ): {
    key: string;
    value: string;
  }[] {
    const raw = data.reduce((acc, item) => {
      if (item.list) {
        const group = (acc.get(item.key) as string[]) || [];
        group.push(item.value);
        acc.set(item.key, group);
      } else {
        acc.set(item.key, item.value);
      }
      return acc;
    }, new Map<string, string | string[]>());
    return Array.from(raw.keys()).map((key) => {
      const value = raw.get(key);
      if (typeof value === "string") return { key, value };
      return { key, value: JSON.stringify(value) };
    });
  }

  const productTags = [];
  for (let i = 0; i < products.length; i++) {
    console.log(`product:${i + 1}/${products.length}`);
    const product = products[i];
    const rawFields = product.tags
      .map((tag) => {
        const field = tagMaps.find((t) => tag.startsWith(t.tag));
        if (!field) return;
        return {
          list: field.list,
          key: field.field,
          value: tag.replace(`${field.tag}_`, ""),
        };
      })
      .filter((f) => f) as { list: boolean; key: string; value: string }[];
    if (rawFields.length === 0) continue;
    const metafields = convertTagsToValues(rawFields);
    productTags.push({ id: product.id, metafields });
  }

  for (let i = 0; i < productTags.length; i += REQ_SIZE) {
    console.log(
      `product: ${i + 1} - ${i + 1 + REQ_SIZE} / ${productTags.length} / ${products.length}`,
    );
    const p = productTags.slice(i, i + REQ_SIZE);
    const data = await Promise.all(p.map((data) => createMetafields(data)));
    console.log(
      "available:",
      data[0].extensions.cost.throttleStatus.currentlyAvailable,
    );
  }
}
main();
