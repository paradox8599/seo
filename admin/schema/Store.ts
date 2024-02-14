import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { integer, relationship, text } from "@keystone-6/core/fields";

import { createdAtField, updatedAtField } from "../helpers/fields";
import { type Lists } from ".keystone/types";
import { fetchAllProducts } from "../lib/shopify/fetch-products";

export const Store: Lists.Store = list({
  access: allowAll,
  ui: {
    listView: {
      initialColumns: ["name", "createdAt", "updatedAt"],
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
    fetchProducts: integer({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
        views: "./admin/views/store-fetch-button",
      },
    }),
    name: text({ validation: { isRequired: true } }),
    adminAccessToken: text({ validation: { isRequired: true } }),
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
        itemView: { fieldMode: "read" },
        createView: { fieldMode: "hidden" },
      },
    }),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
