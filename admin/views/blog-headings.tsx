import { type controller } from "@keystone-6/core/fields/types/json/views";
import { type FieldProps } from "@keystone-6/core/types";
import { Button } from "@keystone-ui/button";
import {
  FieldContainer,
  FieldLabel,
  TextArea,
  TextInput,
} from "@keystone-ui/fields";

import React from "react";
import { useJson } from "./hooks/useJson";
import { BlogHeading } from "../lib/tasks/blog/blog-types";

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

export const Field = ({
  value,
  onChange,
  field,
}: FieldProps<typeof controller>) => {
  const { data, setData } = useJson<BlogHeading[]>({
    value,
    onChange,
  });
  const [hide, setHide] = React.useState(true);

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <div style={{ marginBottom: "1rem" }}>
        <GenButton id={window.location.pathname.split("/")[2]} />
      </div>
      <Button onClick={() => setHide(!hide)}>
        {hide ? "Show" : "Hide"} Headings
      </Button>
      <div style={{ display: hide ? "none" : "block" }}>
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
              <p>{i + 1}.</p>
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
            <TextArea
              style={{ padding: "1rem", color: "grey" }}
              value={desc}
              onChange={(e) => {
                const newData = [...data];
                newData[i].desc = e.target.value;
                setData(newData);
              }}
            />
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
