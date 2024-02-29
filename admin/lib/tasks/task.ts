import { resetSeoFileTasks, runSeoFileTask } from "./seo/seo-file-task";
import { resetSeoTasks, runSeoTask } from "./seo/seo-task";
import { resetBlogTasks, runBlogTask } from "./blog/blog-task";
import { type Context } from ".keystone/types";

export function chunkArray<T>({ arr, size }: { arr: T[]; size: number }) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

export async function start(ctx: Context) {
  // reset seo tasks status
  await resetSeoFileTasks(ctx);
  await resetSeoTasks(ctx);
  await resetBlogTasks(ctx);

  console.log("✅ AI tasks started");
  const tasks = [runSeoFileTask, runSeoTask, runBlogTask];
  while (true) {
    for (const task of tasks) {
      await task(ctx);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
