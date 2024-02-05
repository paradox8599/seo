import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { text } from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";

import { createdAtField } from "../helpers/fields";

export const Instruction: Lists.Instruction = list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true } }),
    description: text({}),
    instruction: text({}),
    createdAt: createdAtField(),
  },
});

