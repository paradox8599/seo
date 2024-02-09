import { type controller } from "@keystone-6/core/fields/types/json/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer, FieldLabel } from "@keystone-ui/fields";

import React from "react";



export const Field = ({ field, value }: FieldProps<typeof controller>) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <div>
        {(JSON.parse(value) as string[]).map((v, i) => <p key={i.toString()}>{v}</p>)}
      </div>
    </FieldContainer>
  );
};


