import { NextApiRequest, NextApiResponse } from "next";
import { type Context } from ".keystone/types";
import { JSONValue } from "@keystone-6/core/types";

export async function createChildBlogAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  if (!context.session?.data?.email) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (!req.query.id) {
    return res.status(400).json({ error: "Missing param: blog id" });
  }
  try {
    type Blog = {
      id: string;
      name: string;
      store: { id: string };
      blog: { document: JSONValue };
    };
    const ctx = context.sudo();
    const blog = (await ctx.query.Blog.findOne({
      where: { id: req.query.id as string },
      query: "id name store { id } blog { document } parent { id name }",
    })) as Blog & { parent?: Blog };
    const parent: Blog = blog.parent ?? blog;
    parent.blog = blog.blog;
    parent.store = blog.store;
    console.log("blog:", blog);

    const newBlog = await ctx.query.Blog.createOne({
      data: {
        name: `${parent.name}`,
        store: { connect: { id: parent.store.id } },
        parent: { connect: { id: parent.id } },
        blog: parent.blog.document,
      },
      query: "id",
    });
    return res.json({ message: "ok", id: newBlog.id });
  } catch (e) {
    console.log(e);
    return res.status(418).json({ error: e });
  }
}
