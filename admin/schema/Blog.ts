import { graphql, list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import {
  checkbox,
  integer,
  relationship,
  text,
  virtual,
} from "@keystone-6/core/fields";
import { document } from "@keystone-6/fields-document";

import { isAdmin, isNotAdmin } from "../helpers/access";
import { createdAtField, updatedAtField } from "../helpers/fields";
import { type Lists } from ".keystone/types";

export const Blog: Lists.Blog = list({
  access: {
    operation: {
      query: allowAll,
      create: isAdmin,
      update: allowAll,
      delete: isAdmin,
    },
    filter: {
      query: ({ session }) => {
        return (
          isAdmin({ session }) || {
            store: { users: { some: { id: { equals: session?.data.id } } } },
          }
        );
      },
      update: ({ session }) => {
        return (
          isAdmin({ session }) || {
            store: { users: { some: { id: { equals: session?.data.id } } } },
          }
        );
      },
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
    version: virtual({
      field: graphql.field({
        type: graphql.Int,
        async resolve(item, _args, context) {
          const parentId = item.parentId ?? item.id;
          const data = (await context.query.Blog.findMany({
            where: { parent: { id: { equals: parentId } } },
            query: "id createdAt",
          })) as { id: string; createdAt: string }[];
          const blogs = data.map((b) => ({
            id: b.id,
            createdAt: new Date(b.createdAt),
          }));
          blogs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          const index = blogs.findIndex((b) => b.id === item.id);
          return index + 2;
        },
      }),
    }),
    create: integer({
      access: isAdmin,
      ui: {
        views: "./admin/views/blog-create-button",
        itemView: { fieldPosition: "sidebar" },
      },
    }),
    parent: relationship({
      ref: "Blog.children",
      many: false,
      ui: {
        itemView: { fieldMode: "read", fieldPosition: "sidebar" },
        hideCreate: true,
      },
    }),
    children: relationship({
      ref: "Blog.parent",
      many: true,
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read", fieldPosition: "sidebar" },
      },
    }),
    store: relationship({
      ref: "Store",
      many: false,
      ui: { itemView: { fieldMode: "read" } },
    }),
    blog: document({
      access: isAdmin,
      formatting: true,
    }),
    comments: document({ formatting: true }),
    approved: checkbox({
      ui: {
        createView: { fieldMode: "hidden" },
      },
    }),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
