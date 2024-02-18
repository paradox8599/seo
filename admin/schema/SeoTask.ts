import { graphql, list } from "@keystone-6/core";
import {
  checkbox,
  integer,
  json,
  relationship,
  text,
  virtual,
} from "@keystone-6/core/fields";

import { createdAtField } from "../helpers/fields";
import { type Lists } from ".keystone/types";
import { TaskStatus } from "../types/task";
import { TaskQueue, Tasks } from "../lib/tasks/task-queue";
import { isAdmin, isNotAdmin } from "../helpers/access";

export const SeoTask: Lists.SeoTask = list({
  access: isAdmin,
  ui: {
    isHidden: isNotAdmin,
    listView: {
      initialColumns: ["id", "description", "store", "status", "createdAt"],
      initialSort: { field: "createdAt", direction: "DESC" },
    },
  },
  hooks: {
    afterOperation: {
      create: async ({ item, context }) => {
        await context.query.SeoTask.updateOne({
          where: { id: item.id },
          data: { status: TaskStatus.pending },
        });
        TaskQueue.add(Tasks.SeoTask, { id: item.id, type: Tasks.SeoTask });
      },
      update: async ({ item, context }) => {
        if (item.retry) {
          await context.query.SeoTask.updateOne({
            where: { id: item.id },
            data: { status: TaskStatus.pending, retry: false },
          });
          const exists = TaskQueue.get(Tasks.SeoTask).filter(
            (t) => t.id === item.id,
          );
          if (exists.length === 0 && item.status !== TaskStatus.pending) {
            TaskQueue.add(Tasks.SeoTask, { id: item.id, type: Tasks.SeoTask });
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
        views: "./admin/views/task-retry-button",
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
        description: "Do not retry when already running",
      },
      hooks: {},
    }),
    store: relationship({
      ref: "Store",
      ui: { itemView: { fieldMode: "read", fieldPosition: "sidebar" } },
    }),
    push: integer({
      ui: {
        views: "./admin/views/seo-task-push-button",
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
      },
    }),
    products: integer({
      ui: {
        views: "./admin/views/seo-task-view-products-button",
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
      },
    }),
    category: text({
      defaultValue: "None",
      ui: {
        itemView: { fieldMode: "read" },
      },
    }),

    // form body
    version: integer({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
      },
    }),
    description: text({}),
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
