import { type controller } from "@keystone-6/core/fields/types/checkbox/views";
import { CellComponent, type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";
import { TaskStatus } from "../types/task";

type BtnText = "Start" | "Starting";
function RetryButton({
  id,
  disabled = false,
}: {
  id: string;
  disabled?: boolean;
}) {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Start",
  });
  return (
    <FieldContainer>
      <Button
        size="small"
        disabled={btn.disabled || disabled}
        onClick={async () => {
          setBtn({ text: "Starting", disabled: true });
          const res = await fetch(`/api/seotask/retry?id=${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          setBtn({ text: "Start", disabled: false });
          if (data.error) {
            console.log(data.error);
            alert(JSON.stringify(data.error));
            return;
          }
          if (data.message === "ok") {
            alert(
              "Success. Please make sure you backup the original products before pushing",
            );
            window.location.reload();
            return;
          }
          alert(`Unknown error: ${JSON.stringify(data, null, 2)}`);
        }}
      >
        {btn.text}
      </Button>
    </FieldContainer>
  );
}

export const Field = ({ itemValue }: FieldProps<typeof controller>) => {
  const item = itemValue as { status: { value: { value: TaskStatus } } };
  if (
    [TaskStatus.pending, TaskStatus.running].includes(item.status.value.value)
  )
    return <></>;
  return (
    <RetryButton
      id={window.location.pathname.split("/")[2]}
      disabled={[TaskStatus.pending, TaskStatus.running].includes(
        item.status.value.value,
      )}
    />
  );
};

export const Cell: CellComponent = ({ item }) => {
  return (
    <RetryButton
      id={item.id}
      disabled={[TaskStatus.pending, TaskStatus.running].includes(item.status)}
    />
  );
};
