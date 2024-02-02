import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { text } from "@keystone-6/core/fields";

import { type Lists } from ".keystone/types";

import { createdAtField } from "../helpers/fields";

export const Prompt: Lists.Prompt = list({
  access: allowAll,
  fields: {
    name: text({ validation: { isRequired: true } }),
    description: text({}),
    prompt: text({}),
    createdAt: createdAtField(),
  },
});

