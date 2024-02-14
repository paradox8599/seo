import { type controller } from "@keystone-6/core/fields/types/text/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer, FieldLabel, Select } from "@keystone-ui/fields";

import React from "react";
import { TaskStatus } from "../types/task";

export const Field = ({
  field,
  value,
  itemValue,
}: FieldProps<typeof controller>) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
    </FieldContainer>
  );
};
