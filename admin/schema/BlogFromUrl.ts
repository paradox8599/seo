import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { json, text } from "@keystone-6/core/fields";

import { isAdmin, isNotAdmin } from "../helpers/access";
import { createdAtField, updatedAtField } from "../helpers/fields";
import { type Lists } from ".keystone/types";
import { JSONValue } from "@keystone-6/core/types";

export const BlogFromUrl: Lists.BlogFromUrl = list({
  access: {
    operation: {
      query: allowAll,
      create: isAdmin,
      update: allowAll,
      delete: isAdmin,
    },
  },
  ui: {
    listView: {
      pageSize: 50,
    },
    hideCreate: isNotAdmin,
    hideDelete: isNotAdmin,
  },
  fields: {
    name: text(),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
    url: text({
      validation: { isRequired: true },
      hooks: {
        afterOperation: async ({ item, operation, context }) => {
          if (operation === "create") {
            const { extract } = await import("@extractus/article-extractor");
            const article = await extract(item.url);
            await context.query.BlogFromUrl.updateOne({
              where: { id: item.id },
              data: { refArticleData: article as JSONValue },
            });
          }
        },
      },
    }),
    refArticleData: json({
      defaultValue: {},
      ui: {
        itemView: { fieldMode: "read" },
        createView: { fieldMode: "hidden" },
      },
    }),
    headings: json({
      defaultValue: [],
      ui: {
        views: "./admin/views/blog-headings",
        createView: { fieldMode: "hidden" },
      },
    }),
  },
});
