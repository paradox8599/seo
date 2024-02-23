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
import { type Context } from ".keystone/types";

async function setStatus({
  context,
  id,
  status = TaskStatus.pending,
}: {
  context: Context;
  id: string;
  status?: TaskStatus;
}) {
  await context.query.SeoTask.updateOne({
    where: { id },
    data: { status: status, retry: false },
  });
}

export const SeoTask: Lists.SeoTask = list({
  access: isAdmin,
  ui: {
    isHidden: isNotAdmin,
    listView: {
      initialColumns: [
        "id",
        "description",
        "store",
        "productCount",
        "version",
        "createdAt",
        "status",
        "retry",
        "push",
      ],
      initialSort: { field: "createdAt", direction: "DESC" },
    },
  },
  hooks: {
    validateInput: async ({ context, addValidationError, resolvedData }) => {
      // only allow collection from the same store
      const colId = resolvedData.collection?.connect?.id;
      const store = resolvedData.store?.connect?.id;
      if (colId) {
        const col = (await context.sudo().query.Collection.findOne({
          where: { id: colId },
          query: "store { id }",
        })) as unknown as { store: { id: string } };
        if (col.store.id !== store) {
          addValidationError("Collection must belong to the same Store");
        }
      }
    },
    afterOperation: {
      create: async ({ item, context }) => {
        // take store version as the initial version
        const { version } = await context.query.Store.findOne({
          where: { id: item.storeId },
          query: "version",
        });
        await context.query.SeoTask.updateOne({
          where: { id: item.id },
          data: { version },
        });
      },
      update: async ({ item, context }) => {
        // add task to queue and update task status on retry
        if (item.retry) {
          await setStatus({ context, id: item.id });
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
    }),
    store: relationship({
      ref: "Store",
      ui: {
        itemView: { fieldMode: "read", fieldPosition: "sidebar" },
        hideCreate: true,
      },
    }),
    push: integer({
      ui: {
        views: "./admin/views/seo-task-push-button",
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
      },
    }),
    productCount: virtual({
      ui: { itemView: { fieldPosition: "sidebar" } },
      field: graphql.field({
        type: graphql.Int,
        async resolve(item, _args, context) {
          return await context.query.Product.count({
            where: {
              store: { id: { equals: item.storeId } },
              category: { contains: item.category },
              OR: item.collectionId
                ? [
                  {
                    collections: {
                      some: { id: { equals: item.collectionId } },
                    },
                  },
                ]
                : [],
              status: { equals: "ACTIVE" },
            },
          });
        },
      }),
    }),
    products: integer({
      ui: {
        views: "./admin/views/seo-task-view-products-button",
        createView: { fieldMode: "hidden" },
        itemView: { fieldPosition: "sidebar" },
      },
    }),
    category: text({
      defaultValue: "",
      ui: {
        itemView: { fieldMode: "read" },
        description: "Leave empty for all",
      },
    }),
    collection: relationship({
      ref: "Collection",
      many: false,
      ui: { itemView: { fieldMode: "read" }, hideCreate: true },
    }),

    // body
    version: integer({
      defaultValue: 0,
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
      },
    }),
    description: text({}),
    inst: relationship({
      ref: "Instruction",
      many: false,
      ui: {
        description: "Select instruction",
        itemView: { fieldMode: "read" },
        hideCreate: true,
      },
      hooks: {
        validateInput({ operation, addValidationError, resolvedData }) {
          if (operation === "create" && !resolvedData.inst?.connect) {
            addValidationError("Instruction is required");
          }
        },
      },
    }),
    instruction: virtual({
      ui: { description: "Text" },
      field: graphql.field({
        type: graphql.String,
        resolve: async (item, _args, context) => {
          const instructions = await context.query.Instruction.findOne({
            where: { id: item.instId },
            query: "instruction",
          });
          return instructions?.instruction ?? "";
        },
      }),
    }),
    logs: json({
      // array of strings
      defaultValue: [],
      ui: {
        views: "./admin/views/task-logs",
        itemView: { fieldMode: "read" },
        createView: { fieldMode: "hidden" },
      },
    }),
  },
});
