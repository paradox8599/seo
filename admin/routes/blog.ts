import { ArticleData } from "@extractus/article-extractor";
import { NextApiRequest, NextApiResponse } from "next";
import { BlogHeading } from "../lib/tasks/blog/blog";
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
    const blog = (await context.query.BlogFromUrl.findOne({
      where: { id },
      query: "headingsInstruction refArticleData",
    })) as unknown as {
      headingsInstruction: string;
      refArticleData: ArticleData;
    };

    const headings = await generateHeadings({
      inst: blog.headingsInstruction,
      article: blog.refArticleData,
    });
    await context.query.BlogFromUrl.updateOne({
      where: { id },
      data: { title: headings.title, headings: headings.headings },
    });

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
      query: "articleInstruction headings refArticleData title",
    })) as unknown as {
      title: string;
      articleInstruction: string;
      refArticleData: ArticleData;
      headings: BlogHeading[];
    };
    const article = await generateArticle({
      inst: blog.articleInstruction,
      headings: { title: blog.title, headings: blog.headings },
      ref: blog.refArticleData,
    });
    await context.query.BlogFromUrl.updateOne({
      where: { id },
      data: { article: article },
    });
    res.json({ message: "ok" });
  } catch (e) {
    console.log(e);
    res.status(418).json({ error: e });
  }
}
