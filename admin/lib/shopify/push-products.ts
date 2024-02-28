import { type Context } from ".keystone/types";
import { pushProduct } from "./graphql";
import { TaskStatus } from "../../types/task";

export async function pushSEOProducts({
  taskId,
  context,
}: {
  taskId: string;
  context: Context;
}) {
  try {
    // query seo task info
    const task = (await context.query.SeoTask.findOne({
      where: { id: taskId },
      query: "store { id version } category version status after",
    })) as {
      store: { id: string; version: number };
      category: string;
      version: number;
      status: TaskStatus;
      after: Date | null;
    };
    task.after = new Date(task.after ?? 0);

    // check if task is completed
    if (task.status !== TaskStatus.success) {
      throw "Task not completed";
    }
    // check if task version is updated with store version
    if (task.version < task.store.version) {
      throw "Task version is outdated";
    }

    // query products by task
    const products = (await context.query.Product.findMany({
      where: {
        productUpdatedAt: { gt: task.after },
        store: { id: { equals: task.store.id } },
        OR:
          task.category.trim() === ""
            ? []
            : [{ category: { equals: task.category } }],
        version: { equals: task.version },
      },
      query:
        "shopifyId SEOTitle SEODescription store { name adminAccessToken }",
    })) as {
      shopifyId: string;
      SEOTitle: string;
      SEODescription: string;
      store: { name: string; adminAccessToken: string };
    }[];

    // push products
    for (const prod of products) {
      await pushProduct({
        store: prod.store.name,
        adminAccessToken: prod.store.adminAccessToken,
        product: prod,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (e) {
    console.log("Push error:", e);
  }
}
