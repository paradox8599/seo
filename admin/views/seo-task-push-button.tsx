import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { CellComponent, type FieldProps } from "@keystone-6/core/types";
import { Button } from "@keystone-ui/button";
import { FieldContainer } from "@keystone-ui/fields";

import React from "react";
import { TaskStatus } from "../types/task";
import { useRouter } from "next/navigation";

type BtnText = "Push Products" | "Pushing";

function PushButton({ id }: { id: string }) {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Push Products",
  });
  const router = useRouter();
  return (
    <FieldContainer>
      <Button
        size="small"
        disabled={btn.disabled}
        onClick={async () => {
          const push = confirm("Confirm pushing products to shopify?");
          if (!push) return;
          setBtn({ text: "Pushing", disabled: true });
          const res = await fetch(`/api/seotask/push-products?id=${id}`, {
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
            router.refresh();
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

export const Cell: CellComponent = ({ item }) => {
  return <PushButton id={item.id} />;
};
