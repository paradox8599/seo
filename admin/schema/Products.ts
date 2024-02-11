import { graphql, list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { relationship, text, virtual } from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";
import { createdAtField, updatedAtField } from "../helpers/fields";

export const Product: Lists.Product = list({
  access: allowAll,
  ui: {
    listView: {
      initialSort: { field: "updatedAt", direction: "DESC" },
      initialColumns: ["title", "SEOTitle", "SEODescription", "status"],
    },
  },
  fields: {
    shopifyId: text({ validation: { isRequired: true }, isIndexed: "unique" }),
    title: text({ validation: { isRequired: true } }),
    SEOTitle: text({}),
    SEODescription: text({ ui: { displayMode: "textarea" } }),
    ImgAltText: virtual({
      ui: { description: "Same as SEO Title" },
      field: graphql.field({
        type: graphql.String,
        resolve: (item) => item.SEOTitle,
      }),
    }),
    store: relationship({
      ref: "Store.products",
      ui: { itemView: { fieldMode: "read", fieldPosition: "sidebar" } },
    }),
    status: text({
      validation: { isRequired: true },
      ui: { itemView: { fieldPosition: "sidebar", fieldMode: "read" } },
    }),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
