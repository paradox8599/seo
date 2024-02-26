import { ArticleData } from "@extractus/article-extractor";
import { ask } from "../../openai";
import { BlogArticle, BlogBrief, BlogHeading } from "./blog-types";
import { type Context } from ".keystone/types";

export async function generateHeadings({
  id,
  context,
}: {
  id: string;
  context: Context;
}) {
  let retries = 0;
  while (true) {
    try {
      const blog = (await context.sudo().query.BlogFromUrl.findOne({
        where: { id },
        query: "headingsInstruction refArticleData",
      })) as unknown as {
        headingsInstruction: string;
        refArticleData: ArticleData;
      };
      const res = (await ask({
        instructions: [blog.headingsInstruction],
        prompt: JSON.stringify({
          title: blog.refArticleData.title,
          description: blog.refArticleData.description,
          content: blog.refArticleData.content,
        }),
      })) as string;
      const headings = JSON.parse(res) as BlogBrief;
      await context.sudo().query.BlogFromUrl.updateOne({
        where: { id },
        data: { title: headings.title, headings: headings.headings },
      });
      console.log("done generating headings");
      return headings;
    } catch (e) {
      retries++;
      console.log(`[Retry ${retries}] ${e}`);
      if (retries > 3) {
        throw "[Blog Heading generation] Too many retries";
      }
    }
  }
}

export async function generateArticle({
  id,
  context,
}: {
  id: string;
  context: Context;
}) {
  let retries = 0;
  while (true) {
    try {
      const blog = (await context.sudo().query.BlogFromUrl.findOne({
        where: { id },
        query: "title articleInstruction headings refArticleData",
      })) as unknown as {
        title: string;
        articleInstruction: string;
        headings: BlogHeading[];
        refArticleData: ArticleData;
      };
      // generate headings first if they are empty
      if (blog.headings.length === 0) {
        const headings = await generateHeadings({ id, context });
        blog.headings = headings.headings;
      }
      // generate article
      const res = (await ask({
        instructions: [blog.articleInstruction],
        prompt:
          JSON.stringify({
            title: blog.refArticleData.title,
            description: blog.refArticleData.description,
            content: blog.refArticleData.content,
          }) + JSON.stringify(blog.headings),
      })) as string;
      const article = JSON.parse(res) as BlogArticle;
      await context.sudo().query.BlogFromUrl.updateOne({
        where: { id },
        data: { article: article },
      });
      console.log("done generating article");
      return article;
    } catch (e) {
      retries++;
      console.log(`[Retry ${retries}] ${e}`);
      if (retries > 3) {
        throw "[Blog Article generation] Too many retries";
      }
    }
  }
}
