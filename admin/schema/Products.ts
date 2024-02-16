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
import { isAdmin, isNotAdmin } from "../helpers/access";

export const Product: Lists.Product = list({
  access: isAdmin,
  ui: {
    isHidden: isNotAdmin,
    listView: {
      initialSort: { field: "updatedAt", direction: "DESC" },
      initialColumns: [
        "title",
        "category",
        "SEOTitle",
        "SEODescription",
        "store",
        "status",
      ],
      pageSize: 500,
    },
    hideCreate: true,
  },
  fields: {
    shopifyId: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      ui: { itemView: { fieldMode: "read", fieldPosition: "sidebar" } },
    }),
    title: text({
      validation: { isRequired: true },
      ui: { itemView: { fieldMode: "read" } },
    }),
    category: text({
      ui: { itemView: { fieldMode: "read" } },
    }),
    SEOTitle: text({}),
    SEODescription: text({ ui: { displayMode: "textarea" } }),
    ImgAltText: virtual({
      ui: { description: "Same as SEO Title" },
      field: graphql.field({
        type: graphql.String,
        resolve: (item) => item.SEOTitle,
      }),
    }),
    raw: json({
      ui: { itemView: { fieldMode: "read" } },
    }),
    version: integer({
      defaultValue: 0,
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read", fieldPosition: "sidebar" },
      },
    }),
    store: relationship({
      ref: "Store.products",
      ui: { itemView: { fieldMode: "read", fieldPosition: "sidebar" } },
    }),
    status: text({
      validation: { isRequired: true },
      ui: { itemView: { fieldPosition: "sidebar", fieldMode: "read" } },
    }),
    push: integer({
      ui: {
        views: "./admin/views/product-push-button",
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
      },
    }),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
