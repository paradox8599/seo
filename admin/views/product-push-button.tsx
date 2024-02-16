import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { CellComponent, type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";

type BtnText = "Push Product" | "Pushing";

function PushButton({ id }: { id: string }) {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Push Product",
  });
  return (
    <FieldContainer>
      <Button
        size="small"
        disabled={btn.disabled}
        onClick={async () => {
          setBtn({ text: "Pushing", disabled: true });
          const res = await fetch(`/api/product/push?id=${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          setBtn({ text: "Push Product", disabled: false });
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

export const Field = ({ value }: FieldProps<typeof controller>) => {
  if (value.kind === "create") return <></>;
  return <PushButton id={window.location.pathname.split("/")[2]} />;
};

export const Cell: CellComponent = ({ item }) => {
  return <PushButton id={item.id} />;
};
