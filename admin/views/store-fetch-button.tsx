import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { CellComponent, type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";

type BtnText = "Fetch Products" | "Fetching";
function FetchButton({ id }: { id: string }) {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Fetch Products",
  });
  return (
    <FieldContainer>
      <Button
        size="small"
        disabled={btn.disabled}
        onClick={async () => {
          setBtn({ text: "Fetching", disabled: true });
          const res = await fetch(`/api/store/fetch-all-products?id=${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          setBtn({ text: "Fetch Products", disabled: false });
          if (data.error) {
            alert(`Error \n${JSON.parse(data.error)}`);
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
  return <FetchButton id={window.location.pathname.split("/")[2]} />;
};

export const Cell: CellComponent = ({ item }) => {
  return <FetchButton id={item.id} />;
};
