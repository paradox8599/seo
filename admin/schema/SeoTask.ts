import { graphql, list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import {
  file,
  integer,
  relationship,
  text,
  virtual,
} from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";
import { createdAtField } from "../helpers/fields";

export const SeoTask: Lists.SeoTask = list({
  access: allowAll,
  ui: { listView: { initialColumns: ["id", "store", "status", "createdAt"] } },
  hooks: {
    afterOperation: async ({ item, operation, context, resolvedData }) => {
      if (operation === "create") {
        if (!resolvedData?.inputFile.filename?.toString().endsWith(".csv")) return;
        const res = await context.query.SeoTask.findOne({
          where: { id: item.id },
          query: "inputFile { url }"
        });
        const file = await fetch(res.inputFile.url);
        const csv = await file.blob();
      }
    }
  },
  fields: {
    // sidebar
    createdAt: createdAtField(),
    status: integer({
      defaultValue: 0,
      ui: {
        views: "./admin/views/task-status",
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read", fieldPosition: "sidebar" },
      },
    }),
    inputFile: file({
      storage: "file_store",
      ui: { itemView: { fieldMode: "edit", fieldPosition: "form" } },
      hooks: {
        validateInput: ({ addValidationError, resolvedData, inputData, item, context, operation }) => {
          if (operation === 'create') {
            if (
              !resolvedData.inputFile.filename ||
              !resolvedData.inputFile.filesize
            ) {
              addValidationError("Input file is required");
            }
          }
          else if (operation === "update") {
            if (
              resolvedData.inputFile.filename !== undefined ||
              resolvedData.inputFile.filesize !== undefined
            ) {
              addValidationError("Input file cannot be changed");
            }
          }

        },
      },
    }),
    outputFile: file({
      storage: "file_store",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read", fieldPosition: "sidebar" },
      },
    }),

    // form body
    description: text({}),
    store: relationship({
      ref: "Store",
      ui: { itemView: { fieldMode: "read" } },
    }),
    prompt: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve: async (_item, _args, context) => {
          const prompts = await context.query.Prompt.findMany({
            where: { name: { equals: "SeoTask" } },
            query: "prompt",
          });
          if (prompts.length !== 1) return "Prompt [SeoTask] not found";
          return prompts[0].prompt;
        },
      }),
    }),
    logs: text({
      ui: {
        displayMode: "textarea",
        itemView: { fieldMode: "read" },
        createView: { fieldMode: "hidden" },
      },
    }),
  },
});

