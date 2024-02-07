import { graphql, list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import {
  checkbox,
  file,
  integer,
  relationship,
  text,
  virtual,
} from "@keystone-6/core/fields";

import { BUCKET } from "../../src/lib/variables";
import { createdAtField } from "../helpers/fields";
import { TaskQueue, Tasks, s3 } from "../lib/task";
import { type Lists } from ".keystone/types";
import { TaskStatus } from "../types/task";

export const SeoTask: Lists.SeoTask = list({
  access: allowAll,
  ui: {
    listView: {
      initialColumns: ["id", "description", "store", "status", "createdAt"],
      initialSort: { field: "createdAt", direction: "DESC" },
    }
  },
  hooks: {
    beforeOperation: async ({ item, operation, inputData }) => {
      if (operation === "delete") {
        await s3.deleteObject({ Key: `outputs/SeoTask/${item.id}.csv`, Bucket: BUCKET.name });
      }
    },
    afterOperation: async ({ item, operation, resolvedData, context }) => {
      if (operation === "create") {
        if (!resolvedData?.inputFile.filename?.toString().endsWith(".csv")) return;
        await context.query.SeoTask.updateOne({ where: { id: item.id }, data: { status: TaskStatus.pending } })
      }
      else if (operation === "update") {
        if (item.retry && item.status !== TaskStatus.pending) {
          TaskQueue.add(Tasks.SeoTask, { id: item.id, type: Tasks.SeoTask });
          await context.query.SeoTask.updateOne({ where: { id: item.id }, data: { status: TaskStatus.pending, retry: false } });
        }
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
    retry: checkbox({ ui: { createView: { fieldMode: "hidden" }, itemView: { fieldPosition: "sidebar" } } }),

    inputFile: file({
      storage: "input_file_storage",
      ui: { itemView: { fieldMode: "edit", fieldPosition: "form" } },
      hooks: {
        // only allow & require upload when creating
        validateInput: ({ addValidationError, resolvedData, operation }) => {
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
    outputFile: virtual({
      ui:{ views: "./admin/views/url" },
      field: graphql.field({
        type: graphql.String,
        resolve: async (item) => `${BUCKET.customUrl}/outputs/SeoTask/${item.id}.csv`
      })
    }),

    // form body
    description: text({}),
    store: relationship({
      ref: "Store",
      ui: { itemView: { fieldMode: "read" } },
    }),
    products: integer({
      ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" }, }
    }),
    instruction: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve: async (_item, _args, context) => {
          const instructions = await context.query.Instruction.findMany({
            where: { name: { equals: "SeoTask" } },
            query: "instruction",
          });
          if (instructions.length !== 1) return "Instruction for [SeoTask] not found";
          return instructions[0].instruction;
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

