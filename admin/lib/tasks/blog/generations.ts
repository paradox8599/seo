import { ArticleData } from "@extractus/article-extractor";
import { ask } from "../../openai";
import { BlogArticle, BlogBrief } from "./blog";

export async function generateHeadings({
  inst,
  article,
}: {
  inst: string;
  article: ArticleData;
}) {
  let retries = 0;
  while (true) {
    try {
      const res = (await ask({
        instructions: [inst],
        prompt: JSON.stringify({
          title: article.title,
          description: article.description,
          content: article.content,
        }),
      })) as string;
      const headings = JSON.parse(res) as BlogBrief;
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
  inst,
  ref,
  headings,
}: {
  inst: string;
  ref: ArticleData;
  headings: BlogBrief;
}) {
  let retries = 0;
  while (true) {
    try {
      const res = (await ask({
        instructions: [inst],
        prompt:
          JSON.stringify({
            title: ref.title,
            description: ref.description,
            content: ref.content,
          }) + JSON.stringify(headings),
      })) as string;
      const article = JSON.parse(res) as BlogArticle;
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
