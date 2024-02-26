import { ArticleData } from "@extractus/article-extractor";
import { NextApiRequest, NextApiResponse } from "next";
import { BlogHeading } from "../lib/tasks/blog/blog-types";
import {
  generateArticle,
  generateHeadings,
} from "../lib/tasks/blog/generations";
import { type Context } from ".keystone/types";

export async function generateBlogHeadingsAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  try {
    if (!context.session?.data?.email) {
      return res.status(401).json({ error: "Not logged in" });
    }
    if (!req.query.id) {
      return res.status(400).json({ error: "Missing param: blog id" });
    }
    const id = req.query.id as string;
    await generateHeadings({ id, context });

    res.json({ message: "ok" });
  } catch (e) {
    console.log(e);
    res.status(418).json({ error: e });
  }
}

export async function generateBlogArticleAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  try {
    if (!context.session?.data?.email) {
      return res.status(401).json({ error: "Not logged in" });
    }
    if (!req.query.id) {
      return res.status(400).json({ error: "Missing param: blog id" });
    }
    const id = req.query.id as string;
    const blog = (await context.query.BlogFromUrl.findOne({
      where: { id },
      query:
        "headingsInstruction articleInstruction headings refArticleData title",
    })) as unknown as {
      title: string;
      articleInstruction: string;
      headingsInstruction: string;
      refArticleData: ArticleData;
      headings: BlogHeading[];
    };
    // generate headings first if they are empty
    if (blog.headings.length === 0) {
      const headings = await generateHeadings({ id, context });
      blog.headings = headings.headings;
    }
    // generate article
    await generateArticle({ id, context });
    res.json({ message: "ok" });
  } catch (e) {
    console.log(e);
    res.status(418).json({ error: e });
  }
}

export async function bulkAddBlogUrlsAPI(
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) {
  if (!context.session?.data?.email) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (!req.query.urls) {
    return res.status(400).json({ error: "Missing param: blog urls" });
  }
  const urls = (req.query.urls as string).split(",");
  try {
    await context.query.BlogFromUrl.createMany({
      data: urls.map((url) => ({ url })),
    });
    res.json({ message: "ok" });
  } catch (e) {
    console.log(e);
    res.status(418).json({ error: e });
  }
}
