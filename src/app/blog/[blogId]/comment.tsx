"use client";

import { updateBlogComment } from "@/lib/api/blog";
import { Button, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React from "react";

export default function Comment({
  value,
  blogId,
}: {
  value: string;
  blogId: string;
}) {
  const [comment, setComment] = React.useState(value);
  const router = useRouter();

  async function saveComment() {
    await updateBlogComment({ id: blogId, comments: comment });
    router.refresh();
  }
  return (
    <section className="container">
      <p>Comments</p>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="rounded-lg shadow"
        variant="faded"
      />
      <div className="flex flex-row justify-start items-center gap-4 m-2">
        <Button onClick={saveComment} size="sm">
          Save
        </Button>
        <Button onClick={() => setComment(value)} size="sm">
          Reset
        </Button>
      </div>
    </section>
  );
}
