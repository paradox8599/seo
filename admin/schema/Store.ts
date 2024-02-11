import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { json, relationship, text } from "@keystone-6/core/fields";

import { createdAtField, updatedAtField } from "../helpers/fields";
import { type Lists } from ".keystone/types";

export const Store: Lists.Store = list({
  access: allowAll,
  ui: {
    listView: {
      initialColumns: ["name", "createdAt", "updatedAt"],
      initialSort: { field: "updatedAt", direction: "DESC" },
    },
  },
  fields: {
    fetchProducts: json({}),
    name: text({ validation: { isRequired: true } }),
    adminAccessToken: text({ validation: { isRequired: true } }),
    products: relationship({ ref: "Product.store", many: true }),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
