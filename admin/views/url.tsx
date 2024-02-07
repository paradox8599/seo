import { type controller } from "@keystone-6/core/fields/types/text/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer, FieldLabel } from "@keystone-ui/fields";

import React from "react";



export const Field = ({ field, value }: FieldProps<typeof controller>) => {
  if (value.kind === "create") return <></>;
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <a href={value as unknown as string}>{value as unknown as string}</a>
    </FieldContainer>
  );
};

