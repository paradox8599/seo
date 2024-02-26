import { ShopifyProduct, TaskStatus } from "../../../types/task";
import { askAll } from "../../openai";

import { TaskQueue, Tasks } from "../task-queue";
import { type Context } from ".keystone/types";

export async function resetSeoTasks(ctx: Context) {
  const seoTaskIdResults = (await ctx.sudo().query.SeoTask.findMany({
    where: { status: { in: [TaskStatus.pending, TaskStatus.running] } },
    query: "id",
  })) as { id: string }[];
  const seoTaskIds = seoTaskIdResults.map((r) => r.id);
  await (ctx.sudo() as unknown as Context).query.SeoTask.updateMany({
    data: seoTaskIds.map((id) => ({
      where: { id },
      data: { status: TaskStatus.idle },
    })),
  });
}

export async function runSeoTask(context: Context) {
  const ctx = context.sudo();
  const task = TaskQueue.consume(Tasks.SeoTask);
  if (!task) return;

  async function log(log: string) {
    if (!task) return;
    const logText = `[${new Date().toLocaleString("en-AU")}] SEO Task: ${log}`;
    console.log(`${task.id} ${logText}`);
    const item = await ctx.query.SeoTask.findOne({
      where: { id: task.id },
      query: "logs",
    });
    await ctx.query.SeoTask.updateOne({
      where: { id: task.id },
      data: {
        logs: [...item.logs, logText],
      },
    });
  }

  async function setStatus(status: TaskStatus) {
    await ctx.query.SeoTask.updateOne({
      where: { id: task?.id ?? "" },
      data: { status },
    });
  }

  try {
    setStatus(TaskStatus.running);
    // take seo task info
    const taskInfo = (await ctx.query.SeoTask.findOne({
      where: { id: task.id },
      query: "store { id version } collection { id } category instruction",
    })) as {
      store: { id: string; version: number };
      collection: null | { id: string };
      category: string;
      instruction: string;
    };
    const newVersion = taskInfo.store.version + 1;

    // find products by store and category
    const products = (await ctx.query.Product.findMany({
      where: {
        store: { id: { equals: taskInfo.store.id } },
        category: { contains: taskInfo.category },
        OR: taskInfo.collection?.id
          ? [
            {
              collections: {
                some: { id: { equals: taskInfo.collection.id } },
              },
            },
          ]
          : [],
        status: { equals: "ACTIVE" },
      },
      query: "id title",
    })) as ShopifyProduct[];

    const preparedProducts = products.map((p, i) => ({ ...p, id: i }));

    // ask AI
    const answers = (await askAll({
      prompts: preparedProducts,
      instructions: [taskInfo.instruction],
    })) as ShopifyProduct[][];

    // replace original products with new content
    for (const item of answers.flat()) {
      if (item.id === undefined) {
        throw "Invalid AI response: no id.";
      }
      if (item.SEOTitle === undefined) {
        throw "Invalid AI response: no SEO Title.";
      }
      if (item.SEODescription === undefined) {
        throw "Invalid AI response: no SEO Description.";
      }

      const index = item.id as unknown as number;
      if (index < 0 || index > products.length) {
        throw `Product ${item.id} not found.`;
      }
      const p = products[index];
      products[index] = { ...p, ...item, id: p.id };
    }

    // write back to db
    await ctx.query.Product.updateMany({
      data: products.map((p) => ({
        where: { id: p.id },
        data: {
          SEOTitle: p.SEOTitle,
          SEODescription: p.SEODescription,
          version: newVersion,
        },
      })),
    });
    await ctx.query.Store.updateOne({
      where: { id: taskInfo.store.id },
      data: { version: newVersion },
    });
    await ctx.query.SeoTask.updateOne({
      where: { id: task.id },
      data: { version: newVersion },
    });
    await setStatus(TaskStatus.success);
    console.log(`SEO task ${task.id} for store ${taskInfo.store.id} done`);
  } catch (e) {
    await log(`${e}`);
    await setStatus(TaskStatus.failure);
  }
}
