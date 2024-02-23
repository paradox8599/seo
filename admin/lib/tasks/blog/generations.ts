import { ArticleData } from "@extractus/article-extractor";
import { ask } from "../../openai";

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
      const headings = JSON.parse(res) as {
        title: string;
        headings: { heading: string; desc: string }[];
      };
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
