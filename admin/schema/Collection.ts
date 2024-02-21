import { graphql, list } from "@keystone-6/core";
import { relationship, text, virtual } from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";

import { isAdmin, isNotAdmin } from "../helpers/access";
import { createdAtField } from "../helpers/fields";

export const Collection: Lists.Collection = list({
  access: isAdmin,
  ui: { isHidden: isNotAdmin, hideCreate: true, hideDelete: true },
  fields: {
    label: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item, _args, context) {
          const store = (await context.sudo().query.Store.findOne({
            where: { id: item.storeId },
            query: "name",
          })) as unknown as { name: string };
          return `${store.name} - ${item.name}`;
        },
      }),
    }),
    name: text({
      validation: { isRequired: true },
      ui: {
        itemView: { fieldMode: "read" },
        description: "Original title of the collection",
      },
    }),
    store: relationship({
      ref: "Store.collections",
      many: false,
      ui: { itemView: { fieldMode: "read" } },
    }),
    products: relationship({
      ref: "Product.collections",
      many: true,
      ui: { itemView: { fieldMode: "read" } },
    }),
    createdAt: createdAtField(),
  },
});
