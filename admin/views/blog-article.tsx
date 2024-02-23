import { type controller } from "@keystone-6/core/fields/types/json/views";
import { type FieldProps } from "@keystone-6/core/types";
import { Button } from "@keystone-ui/button";
import { FieldContainer, FieldLabel } from "@keystone-ui/fields";

import React from "react";
import { useJson } from "./hooks/useJson";
import { BlogArticle } from "../lib/tasks/blog/blog";

type BtnText = "Generate Article" | "Generating";

function GenButton({ id }: { id: string }) {
  const [btn, setBtn] = React.useState<{ disabled: boolean; text: BtnText }>({
    disabled: false,
    text: "Generate Article",
  });
  return (
    <Button
      disabled={btn.disabled}
      onClick={async () => {
        setBtn({ text: "Generating", disabled: true });
        try {
          const res = await fetch(`/api/blog/generate-article?id=${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          setBtn({ text: "Generate Article", disabled: false });
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
          setBtn({ text: "Generate Article", disabled: false });
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
  const { data } = useJson<BlogArticle>({
    value,
    onChange,
  });

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <div style={{ marginBottom: "1rem" }}>
        <GenButton id={window.location.pathname.split("/")[2]} />
      </div>
      <article>
        <h2>{data.title}</h2>
        <p>{data.desc}</p>
        {data.sections.map((s, i) => (
          <section key={i.toString()}>
            <h3>{s.heading}</h3>
            <p>{s.content}</p>
          </section>
        ))}
      </article>
    </FieldContainer>
  );
};
