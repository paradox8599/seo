import { list } from "@keystone-6/core";
import { text } from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";

import { isAdmin, isNotAdmin } from "../helpers/access";
import { createdAtField } from "../helpers/fields";

export const Instruction: Lists.Instruction = list({
  access: isAdmin,
  ui: { isHidden: isNotAdmin },
  fields: {
    name: text({ validation: { isRequired: true } }),
    description: text({}),
    instruction: text({ ui: { displayMode: "textarea" } }),
    createdAt: createdAtField(),
  },
});
