import { type controller } from "@keystone-6/core/fields/types/text/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer, FieldLabel } from "@keystone-ui/fields";

import React from "react";
import { TaskStatus } from "../types/task";

export const Field = ({
  field,
  value,
  itemValue,
}: FieldProps<typeof controller>) => {
  if (value.kind === "create") return <></>;
  const success =
    (itemValue as { status: { value: { value: TaskStatus } } }).status.value
      .value === TaskStatus.success;
  // const dlName = (
  //   itemValue as {
  //     inputFile: { value: { data: { filename: string } } };
  //   }
  // ).inputFile.value.data.filename.replace(/-[\w\d]+.csv$/, ".csv");
  if (!success) return <></>;
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <a href={value as unknown as string}>{value as unknown as string}</a>
    </FieldContainer>
  );
};
