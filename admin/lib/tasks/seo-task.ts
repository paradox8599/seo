import { KeystoneContext } from "@keystone-6/core/types";
import { ShopifyProduct, TaskStatus } from "../../types/task";
import { askAll } from "../openai";

import { TaskQueue, Tasks } from "./task-queue";
import { type Context } from ".keystone/types";

export async function resetSeoTasks(ctx: KeystoneContext) {
  const seoTaskIdResults = (await (
    ctx.sudo() as unknown as Context
  ).query.SeoTask.findMany({
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

export async function runSeoTask(context: KeystoneContext) {
  const ctx = context.sudo() as unknown as Context;
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
    const res = (await ctx.query.SeoTask.findOne({
      where: { id: task.id },
      query: "store { id } category instruction",
    })) as { store: { id: string }; category: string; instruction: string };

    const { version } = (await ctx.query.Store.findOne({
      where: { id: res.store.id },
      query: "version",
    })) as { version: number };
    const newVersion = version + 1;

    // find products by store and category
    const products = (await ctx.query.Product.findMany({
      where: {
        store: { id: { equals: res.store.id } },
        category: { equals: res.category },
        status: { equals: "ACTIVE" },
      },
      query: "id title version",
    })) as ShopifyProduct[];

    const answers = (await askAll({
      prompts: products,
      instruction: res.instruction,
    })) as ShopifyProduct[][];
    // replace original products with new content
    for (const item of answers.flat()) {
      if (item.id === undefined) throw "Invalid AI response: no id.";
      if (item.SEOTitle === undefined)
        throw "Invalid AI response: no SEO Title.";
      if (item.SEODescription === undefined)
        throw "Invalid AI response: no SEO Description.";

      const idx = products.findIndex((p) => p.id === item.id);
      if (idx < 0) throw `Product ${item.id} not found.`;
      const p = products[idx];
      products[idx] = { ...p, ...item };
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
      where: { id: res.store.id },
      data: { version: newVersion },
    });
    await ctx.query.SeoTask.updateOne({
      where: { id: task.id },
      data: { version: newVersion },
    });
    await setStatus(TaskStatus.success);
    console.log("done");
  } catch (e) {
    await log(`${e}`);
    await setStatus(TaskStatus.failure);
  }
}
