import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps, type CellComponent } from "@keystone-6/core/types";
import { FieldContainer, FieldLabel } from "@keystone-ui/fields";

import React from "react";
import { TaskStatus } from "../types/task";


function Status({ status }: { status: TaskStatus }) {
  const colors = {
    [TaskStatus.idle]: "gray",
    [TaskStatus.pending]: "yellow",
    [TaskStatus.canceled]: "pink",
    [TaskStatus.running]: "blue",
    [TaskStatus.success]: "green",
    [TaskStatus.failure]: "red",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div
        style={{
          background: colors[status],
          height: 15,
          width: 15,
          borderRadius: 10,
        }}
      />
      <div>{Object.values(TaskStatus)[status].toString().toUpperCase()}</div>
    </div>
  );
}

export const Field = ({ field, value }: FieldProps<typeof controller>) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <Status status={value.value as TaskStatus} />
    </FieldContainer>
  );
};

export const Cell: CellComponent = ({ item }) => {
  return <Status status={item.status as TaskStatus} />;
};

