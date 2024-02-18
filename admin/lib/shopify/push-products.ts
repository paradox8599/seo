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
      query: "store { id } category version status",
    })) as {
      store: { id: string };
      category: string;
      version: number;
      status: TaskStatus;
    };

    // check if task is completed
    if (task.status !== TaskStatus.success) {
      throw "Task not completed";
    }

    // query products by task
    const products = (await context.query.Product.findMany({
      where: {
        store: { id: { equals: task.store.id } },
        // category: { equals: task.category },
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
