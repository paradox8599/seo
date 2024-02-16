import { list } from "@keystone-6/core";
import { text, password, select } from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";
import { createdAtField, updatedAtField } from "../helpers/fields";
import { Role, RoleName } from "../../src/lib/types/auth";
import { isAdmin } from "../helpers/access";
import { allowAll } from "@keystone-6/core/access";

export const User: Lists.User = list({
  access: {
    operation: {
      query: allowAll,
      create: isAdmin,
      update: allowAll,
      delete: isAdmin,
    },
    filter: {
      query: ({ session }) => {
        return isAdmin({ session }) || { id: { equals: session.data.id } };
      },
    },
  },
  fields: {
    name: text({}),
    email: text({
      access: { update: isAdmin },
      validation: { isRequired: true },
      isIndexed: "unique",
      ui: { itemView: { fieldMode: "read" } },
    }),
    password: password({ validation: { isRequired: true } }),
    role: select({
      access: { update: isAdmin },
      type: "integer",
      defaultValue: Role.User,
      options: Object.keys(Role)
        .filter((v) => Number.isNaN(Number(v)) && !["None", "All"].includes(v))
        .map((key) => ({
          label: key,
          value: Role[key as RoleName],
        })),
      ui: { itemView: { fieldMode: "read", fieldPosition: "sidebar" } },
    }),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
  },
});
