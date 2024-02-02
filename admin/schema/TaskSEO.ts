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

export const TaskSEO: Lists.TaskSEO = list({
  access: allowAll,
  ui: { listView: { initialColumns: ["id", "store", "status", "createdAt"] } },

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
      ui: { itemView: { fieldMode: "read", fieldPosition: "sidebar" } },
      hooks: {
        validateInput: ({ addValidationError, resolvedData }) => {
          if (
            resolvedData.inputFile.filename === null ||
            resolvedData.inputFile.filesize === null
          ) {
            addValidationError("Input file is required");
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
            where: { name: { equals: "TaskSEO" } },
            query: "prompt",
          });
          if (prompts.length !== 1) throw Error("SeoTask not found");
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

