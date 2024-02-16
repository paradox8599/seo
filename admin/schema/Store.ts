import { list } from "@keystone-6/core";
import { integer, relationship, text } from "@keystone-6/core/fields";

import { createdAtField, updatedAtField } from "../helpers/fields";
import { type Lists } from ".keystone/types";
import { fetchAllProducts } from "../lib/shopify/fetch-products";
import { isAdmin, isNotAdmin } from "../helpers/access";

export const Store: Lists.Store = list({
  access: isAdmin,
  ui: {
    isHidden: isNotAdmin,
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
    users: relationship({ ref: "User", many: true }),
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
        itemView: { fieldMode: "hidden" },
        createView: { fieldMode: "hidden" },
      },
    }),
    background: text({
      ui: {
        description:
          "Store background information (try asking: https://gemini.google.com/app to conclude it)",
        displayMode: "textarea",
      },
    }),

    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
