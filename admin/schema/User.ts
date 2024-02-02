import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { text, password, select } from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";
import { Role, RoleName } from "../../src/lib/types/auth";
import { createdAtField, updatedAtField } from "../../admin/helpers/fields";

export const User: Lists.User = list({
  // WARNING
  //   for this example, anyone can create, query, update and delete anything
  //   if you want to prevent random people on the internet from accessing your data,
  //   you can find out more at https://keystonejs.com/docs/guides/auth-and-access-control
  access: allowAll,
  fields: {
    name: text({}),
    email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
    password: password({ validation: { isRequired: true } }),
    role: select({
      type: "integer",
      defaultValue: Role.None,
      options: Object.keys(Role)
        .filter((v) => isNaN(Number(v)))
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
