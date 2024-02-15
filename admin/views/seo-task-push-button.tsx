import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";
import { TaskStatus } from "../types/task";

type BtnText = "Push Products" | "Pushing";

function PushButton({ id }: { id: string }) {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Push Products",
  });
  return (
    <FieldContainer>
      <Button
        disabled={btn.disabled}
        onClick={async () => {
          setBtn({ text: "Pushing", disabled: true });
          const res = await fetch(`/api/task/push-products?id=${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          setBtn({ text: "Push Products", disabled: false });
          if (data.error) {
            console.log(data.error);
            alert(JSON.stringify(data.error));
            return;
          }
          if (data.message === "ok") {
            alert("Success");
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

export const Field = ({ value, itemValue }: FieldProps<typeof controller>) => {
  if (value.kind === "create") return <></>;
  if (
    (itemValue as { status: { value: { value: TaskStatus } } }).status.value
      .value !== TaskStatus.success
  ) {
    return <></>;
  }
  return <PushButton id={window.location.pathname.split("/")[2]} />;
};
