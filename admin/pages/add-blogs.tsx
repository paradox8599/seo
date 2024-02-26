import { PageContainer } from "@keystone-6/core/admin-ui/components";
import { Heading } from "@keystone-ui/core";
import { TextInput } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";
import React from "react";
import { Textarea } from "@nextui-org/react";

export default function CustomPage() {
  const [bulkUrls, setBulkUrls] = React.useState<string>("");
  const [urls, setUrls] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  return (
    <PageContainer header={<Heading type="h3">Bulk Add Blog Urls</Heading>}>
      <section style={{ padding: "1rem" }}>
        <p>
          <Textarea
            style={{ border: "1px solid black" }}
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
          />
        </p>
        <div
          style={{
            display: "flex",
            justifyItems: "start",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Button
            onClick={() => {
              if (bulkUrls.trim().length === 0) {
                setUrls([...urls, ""]);
              } else {
                setUrls([
                  ...urls,
                  ...bulkUrls.split("\n").filter((u) => u.trim().length > 0),
                ]);
                setBulkUrls("");
              }
            }}
          >
            Add
          </Button>
          <Button
            disabled={loading}
            onClick={async () => {
              if (urls.filter((url) => url.trim().length > 0).length === 0) {
                return;
              }
              setLoading(true);
              try {
                const d = await fetch(
                  `/api/blog/bulk-add?urls=${urls.map(encodeURIComponent).join(",")}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  },
                );
                console.log(await d.json());
                window.location.assign("/blog-from-urls");
              } catch (e) {
                alert(e);
              }
              setLoading(false);
            }}
          >
            Submit
          </Button>
        </div>
        {urls
          .map((url, i) => (
            <div
              key={i.toString()}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyItems: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <p>{i + 1}.</p>
              <TextInput
                value={url}
                onChange={(e) => {
                  const data = [...urls];
                  data[i] = e.target.value;
                  setUrls(data);
                }}
              />
              <Button
                tabIndex={-1}
                onClick={() => {
                  const data = [...urls];
                  data.splice(i, 1);
                  setUrls(data);
                }}
              >
                x
              </Button>
            </div>
          ))
          .toReversed()}
      </section>
    </PageContainer>
  );
}
