import { graphql, list } from "@keystone-6/core";
import {
  integer,
  json,
  relationship,
  text,
  virtual,
} from "@keystone-6/core/fields";

import { createdAtField, updatedAtField } from "../helpers/fields";
import { type Lists } from ".keystone/types";
import { fetchAllProducts } from "../lib/shopify/fetch-products";
import { isAdmin, isNotAdmin } from "../helpers/access";

export const Store: Lists.Store = list({
  access: isAdmin,
  ui: {
    isHidden: isNotAdmin,
    listView: {
      initialColumns: [
        "alias",
        "name",
        "version",
        "createdAt",
        "updatedAt",
        "fetchProducts",
      ],
      initialSort: { field: "updatedAt", direction: "DESC" },
      pageSize: 50,
    },
  },
  hooks: {
    beforeOperation: {
      delete: async ({ item, context }) => {
        await context.prisma.product.deleteMany({
          where: { store: { id: { equals: item.id } } },
        });
      },
    },
    afterOperation: {
      create: ({ item, context }) => fetchAllProducts(item.id, context),
    },
  },
  fields: {
    orderSummary: json({
      ui: {
        createView: { fieldMode: "hidden" },
        views: "./admin/views/store-order-summary",
      },
    }),
    fetchProducts: integer({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
        views: "./admin/views/store-fetch-button",
      },
    }),
    viewProducts: integer({
      ui: {
        views: "./admin/views/store-products-url",
        itemView: {
          fieldMode: "read",
          fieldPosition: "sidebar",
        },
        createView: { fieldMode: "hidden" },
      },
    }),
    // users: relationship({ ref: "User", many: true }),
    label: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve: (item) => item.alias || item.name,
      }),
    }),
    storeUrl: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve: (item) => `https://admin.shopify.com/store/${item.name}`,
      }),
    }),
    alias: text({}),
    name: text({
      validation: { isRequired: true },
      ui: {
        description:
          "Store name in shopify admin page url: https://admin.shopify.com/store/<store name>",
      },
    }),
    adminAccessToken: text({
      validation: { isRequired: true },
      ui: {
        description: "Requires permissions: read_products & write_products",
      },
    }),
    version: integer({
      defaultValue: 0,
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read", fieldPosition: "sidebar" },
      },
    }),
    products: relationship({
      ref: "Product.store",
      many: true,
      ui: {
        itemView: { fieldMode: "hidden" },
        createView: { fieldMode: "hidden" },
      },
    }),
    collections: relationship({
      ref: "Collection.store",
      many: true,
      ui: {
        itemView: { fieldMode: "hidden" },
        createView: { fieldMode: "hidden" },
      },
    }),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
