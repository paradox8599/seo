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
import { parseCSV } from "../lib/csv_manager";
import { TaskQueue } from "../lib/task";
import { ShopifyProduct } from "../types/task";

export const SeoTask: Lists.SeoTask = list({
  access: allowAll,
  ui: { listView: { initialColumns: ["id", "store", "status", "createdAt"] } },
  hooks: {
    afterOperation: async ({ item, operation, context, resolvedData }) => {
      if (operation === "create") {
        if (!resolvedData?.inputFile.filename?.toString().endsWith(".csv")) return;
        const res = await context.query.SeoTask.findOne({
          where: { id: item.id },
          query: "instruction inputFile { url }"
        }) as { instruction: string; inputFile: { url: string } };

        const file = await fetch(res.inputFile.url);
        const csv = await file.blob();
        const data: ShopifyProduct[] = await parseCSV(await csv.text()) as unknown[] as ShopifyProduct[];

        TaskQueue.add("SeoTask", {
          id: item.id,
          type: 'SeoTask',
          instruction: res.instruction,
          data: data
            .filter((r) => r.Status === "Active" && r.Title.trim() !== "")
            .map((p) => ({ Title: p.Title }))
        });
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

