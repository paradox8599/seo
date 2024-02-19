import { keystoneContext as ctx } from "@/keystone/context";
import { DocumentRenderer } from "@keystone-6/document-renderer";
import { Button, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";

import _ from "lodash";
import Link from "next/link";
import React from "react";
import Comment from "./comment";

export default async function Blog({ params }: { params: { blogId: string } }) {
  const blog = (await ctx.sudo().query.Blog.findOne({
    where: { id: params.blogId },
    query:
      "id name version store { id name } parent { id } blog { document } createdAt updatedAt approved comments",
  })) as unknown as {
    id: string;
    version: number;
    name: string;
    store: { id: string; name: string };
    parent: { id: string };
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    blog: { document: any };
    createdAt: string;
    updatedAt: string;
    approved: boolean;
    comments: string;
  };

  return (
    <main className="w-full flex flex-col justify-center items-center py-4 gap-4">
      <section className="container flex flex-row">
        <Link href={`/blogs/${blog.store.id}`}>
          <Button>&lt; All {blog.store.name} blogs</Button>
        </Link>
      </section>
      <section className="container flex flex-col gap-2">
        <Card shadow="md">
          <CardHeader>
            <Chip size="sm" className="shadow-inner">
              v{blog.version}
            </Chip>
            <p className="mx-2">{blog.name}</p>
          </CardHeader>
          <CardBody>
            <DocumentRenderer document={blog.blog.document} />
          </CardBody>
        </Card>
      </section>
      <Comment value={blog.comments} blogId={blog.id} />
    </main>
  );
}
