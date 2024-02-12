import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";

type BtnText = "Fetch Products" | "Fetching";

export const Field = ({ value, itemValue }: FieldProps<typeof controller>) => {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Fetch Products",
  });
  if (value.kind === "create") return <></>;
  const id = (itemValue as { products: { value: { id: string } } }).products
    .value.id;
  return (
    <FieldContainer>
      <Button
        disabled={btn.disabled}
        onClick={async () => {
          setBtn({ text: "Fetching", disabled: true });
          const res = await fetch(`/api/store/fetch-all-products?id=${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (data.error) {
            console.log(data.error);
            alert(JSON.stringify(data.error));
            return;
          }
          setBtn({ text: "Fetch Products", disabled: false });
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
