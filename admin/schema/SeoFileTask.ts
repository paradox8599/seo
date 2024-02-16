import { graphql, list } from "@keystone-6/core";
import {
  checkbox,
  file,
  integer,
  json,
  text,
  virtual,
} from "@keystone-6/core/fields";

import { BUCKET } from "../../src/lib/variables";
import { createdAtField } from "../helpers/fields";
import { s3 } from "../lib/tasks/s3";
import { TaskQueue, Tasks } from "../lib/tasks/task-queue";
import { TaskStatus } from "../types/task";
import { type Lists } from ".keystone/types";
import { isAdmin, isNotAdmin } from "../helpers/access";

export const SeoFileTask: Lists.SeoFileTask = list({
  access: isAdmin,
  ui: {
    isHidden: isNotAdmin,
    listView: {
      initialColumns: ["id", "description", "store", "status", "createdAt"],
      initialSort: { field: "createdAt", direction: "DESC" },
    },
  },
  hooks: {
    beforeOperation: async ({ item, operation }) => {
      if (operation === "delete") {
        await s3.deleteObject({
          Key: `outputs/SeoTask/${item.id}.csv`,
          Bucket: BUCKET.name,
        });
      }
    },
    afterOperation: {
      create: async ({ item, resolvedData, context }) => {
        if (!resolvedData?.inputFile.filename?.toString().endsWith(".csv"))
          return;
        await context.query.SeoFileTask.updateOne({
          where: { id: item.id },
          data: { status: TaskStatus.pending },
        });
        TaskQueue.add(Tasks.SeoFileTask, {
          id: item.id,
          type: Tasks.SeoFileTask,
        });
      },
      update: async ({ item, context }) => {
        if (item.retry) {
          await context.query.SeoFileTask.updateOne({
            where: { id: item.id },
            data: { status: TaskStatus.pending, retry: false },
          });
          if (item.status !== TaskStatus.pending) {
            TaskQueue.add(Tasks.SeoFileTask, {
              id: item.id,
              type: Tasks.SeoFileTask,
            });
          }
        }
      },
    },
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
    retry: checkbox({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
        description: "Do not retry when already running",
      },
    }),

    inputFile: file({
      storage: "input_file_storage",
      ui: { itemView: { fieldMode: "edit", fieldPosition: "form" } },
      hooks: {
        // only allow & require upload when creating
        validateInput: ({ addValidationError, resolvedData, operation }) => {
          if (operation === "create") {
            if (
              !resolvedData.inputFile.filename ||
              !resolvedData.inputFile.filesize
            ) {
              addValidationError("Input file is required");
            }
          } else if (operation === "update") {
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
      ui: { views: "./admin/views/seo-file-output-url", createView: { fieldMode: "hidden" } },
      field: graphql.field({
        type: graphql.String,
        resolve: async (item) =>
          `${BUCKET.customUrl}/outputs/SeoTask/${item.id}.csv`,
      }),
    }),

    // form body
    description: text({}),
    products: integer({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
      },
    }),
    instruction: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve: async (_item, _args, context) => {
          const instructions = await context.query.Instruction.findMany({
            where: { name: { equals: "SeoTask" } },
            query: "instruction",
          });
          if (instructions.length !== 1)
            return "Instruction for [SeoTask] not found";
          return instructions[0].instruction;
        },
      }),
    }),
    logs: json({
      defaultValue: [],
      ui: {
        views: "./admin/views/task-logs",
        itemView: { fieldMode: "read" },
        createView: { fieldMode: "hidden" },
      },
    }),
  },
});
