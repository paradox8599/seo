import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";

type BtnText = "Push Products" | "Pushing";

export const Field = ({ value }: FieldProps<typeof controller>) => {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Push Products",
  });
  if (value.kind === "create") return <></>;
  return (
    <FieldContainer>
      <Button
        disabled={btn.disabled}
        onClick={async () => {
          setBtn({ text: "Pushing", disabled: true });
          const res = await fetch(
            `/api/product/push?id=${window.location.pathname.split("/")[2]}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            },
          );
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
};
