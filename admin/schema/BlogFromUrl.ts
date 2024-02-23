import { graphql, list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { json, relationship, text, virtual } from "@keystone-6/core/fields";

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
      ui: {
        description: "Url to the reference article",
        itemView: { fieldMode: "read" },
      },
      hooks: {
        afterOperation: async ({ item, operation, context }) => {
          if (operation === "create") {
            const { extract } = await import("@extractus/article-extractor");
            const article = await extract(item.url);
            await context.query.BlogFromUrl.updateOne({
              where: { id: item.id },
              data: {
                name:
                  item.name.trim() === "" ? article?.title ?? "" : item.name,
                refArticleData: article as JSONValue,
              },
            });
          }
        },
      },
    }),
    title: text({
      ui: { createView: { fieldMode: "hidden" } },
    }),
    headings: json({
      defaultValue: [],
      ui: {
        views: "./admin/views/blog-headings",
        createView: { fieldMode: "hidden" },
      },
    }),
    article: json({
      defaultValue: { title: "", headings: [] },
      ui: {
        views: "./admin/views/blog-article",
        createView: { fieldMode: "hidden" },
      },
    }),
    headingsInstruction: virtual({
      ui: {
        description: "Instruction for generating headings",
        itemView: { fieldPosition: "sidebar" },
      },
      field: graphql.field({
        type: graphql.String,
        resolve: async (_item, _args, context) => {
          const instructions = await context.query.Instruction.findMany({
            where: { name: { equals: "BlogHeadings" } },
            query: "instruction",
          });
          if (instructions.length !== 1) {
            throw "BlogHeadings instruction not found";
          }
          return instructions[0]?.instruction ?? "";
        },
      }),
    }),
    articleInstruction: virtual({
      ui: {
        description: "Instruction for generating the article",
        itemView: { fieldPosition: "sidebar" },
      },
      field: graphql.field({
        type: graphql.String,
        resolve: async (_item, _args, context) => {
          const instructions = await context.query.Instruction.findMany({
            where: { name: { equals: "BlogArticle" } },
            query: "instruction",
          });
          if (instructions.length !== 1) {
            throw "BlogArticle instruction not found";
          }
          return instructions[0]?.instruction ?? "";
        },
      }),
    }),
    refArticleData: json({
      defaultValue: {},
      ui: {
        itemView: { fieldPosition: "sidebar", fieldMode: "read" },
        createView: { fieldMode: "hidden" },
      },
    }),
  },
});
