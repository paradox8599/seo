import { type controller } from "@keystone-6/core/fields/types/json/views";
import { type FieldProps } from "@keystone-6/core/types";
import { Button } from "@keystone-ui/button";
import { FieldContainer, TextInput, FieldLabel } from "@keystone-ui/fields";

import React from "react";
import { useJson } from "./hooks/useJson";

type BtnText = "Generate Headings" | "Generating";

function GenButton({ id }: { id: string }) {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Generate Headings",
  });
  return (
    <Button
      disabled={btn.disabled}
      onClick={async () => {
        setBtn({ text: "Generating", disabled: true });
        try {
          const res = await fetch(`/api/blog/generate-headings?id=${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          setBtn({ text: "Generate Headings", disabled: false });
          if (data.error) {
            console.log(data.error);
            alert(JSON.stringify(data.error));
            return;
          }
          if (data.message === "ok") {
            window.location.reload();
            return;
          }
          alert(`Unknown error: ${JSON.stringify(data, null, 2)}`);
        } catch (e) {
          setBtn({ text: "Generate Headings", disabled: false });
          alert(`Request error: ${e}`);
        }
      }}
    >
      {btn.text}
    </Button>
  );
}

export const Field = ({ value, onChange }: FieldProps<typeof controller>) => {
  const { data, setData } = useJson<{ heading: string; desc: string }[]>({
    value,
    onChange,
  });

  return (
    <FieldContainer>
      <FieldLabel>Headings</FieldLabel>
      <div style={{ marginBottom: "1rem" }}>
        <GenButton id={window.location.pathname.split("/")[2]} />
      </div>
      <div>
        {data.map(({ heading, desc }, i) => (
          <div key={i.toString()} style={{}}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyItems: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <TextInput
                value={heading}
                onChange={(e) => {
                  const newData = [...data];
                  newData[i].heading = e.target.value;
                  setData(newData);
                }}
              />
              <Button
                tabIndex={-1}
                onClick={() => {
                  const newData = [...data];
                  newData.splice(i, 1);
                  setData(newData);
                }}
              >
                x
              </Button>
            </div>
            <div style={{ padding: "0.5rem" }}>{desc}</div>
          </div>
        ))}
        <div>
          <Button
            onClick={() => {
              setData([...data, { heading: "", desc: "" }]);
            }}
          >
            Add Heading
          </Button>
        </div>
      </div>
    </FieldContainer>
  );
};
