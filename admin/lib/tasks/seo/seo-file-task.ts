import { KeystoneContext } from "@keystone-6/core/types";
import { dumpCSV, parseCSV } from "../csv_manager";

import { s3 } from "./s3";
import { type Context } from ".keystone/types";
import { TaskStatus, ShopifyProduct } from "../../../types/task";
import { askAll } from "../../openai";
import { TaskQueue, Tasks } from "../task-queue";
import { BUCKET } from "../../../../src/lib/variables";

export type ShopifyCSVProduct = {
  id?: string;
  Title: string;
  "SEO Title": string;
  "SEO Description": string;
  "Image Alt Text"?: string;
  Status: string;
};

export async function resetSeoFileTasks(ctx: KeystoneContext) {
  const seoTaskIdResults = (await (
    ctx.sudo() as unknown as Context
  ).query.SeoFileTask.findMany({
    where: { status: { in: [TaskStatus.pending, TaskStatus.running] } },
    query: "id",
  })) as { id: string }[];
  const seoTaskIds = seoTaskIdResults.map((r) => r.id);
  await (ctx.sudo() as unknown as Context).query.SeoFileTask.updateMany({
    data: seoTaskIds.map((id) => ({
      where: { id },
      data: { status: TaskStatus.idle },
    })),
  });
}

export async function runSeoFileTask(context: KeystoneContext) {
  const ctx = context.sudo() as unknown as Context;
  const task = TaskQueue.consume(Tasks.SeoFileTask);
  if (!task) return;
  // log
  async function log(log: string) {
    if (!task) return;
    const logText = `[${new Date().toLocaleString("en-AU")}] ${log}`;
    console.log(`${task.id} ${logText}`);
    const item = await ctx.query.SeoFileTask.findOne({
      where: { id: task.id },
      query: "logs",
    });
    await ctx.query.SeoFileTask.updateOne({
      where: { id: task.id },
      data: {
        logs: [...item.logs, logText],
      },
    });
  }

  async function setStatus(status: TaskStatus) {
    await ctx.query.SeoFileTask.updateOne({
      where: { id: task?.id ?? "" },
      data: { status },
    });
  }

  try {
    await setStatus(TaskStatus.running);
    // query stored info
    const res = (await ctx.query.SeoFileTask.findOne({
      where: { id: task.id },
      query: "instruction inputFile { url }",
    })) as { instruction: string; inputFile: { url: string } };
    // read csv file
    const file = await fetch(res.inputFile.url);
    const csv = await file.blob();
    const csvProducts = (await parseCSV(
      await csv.text(),
    )) as ShopifyCSVProduct[];
    const products: ShopifyProduct[] = csvProducts.map((p, i) => ({
      id: `${i}`,
      title: p.Title ?? "",
      SEOTitle: p["SEO Title"],
      SEODescription: p["SEO Description"],
      status: p.Status,
    }));
    // filter only active products with names
    const filteredProducts = products
      .filter(
        (r) => r.status?.toLowerCase() === "active" && r.title?.trim() !== "",
      )
      .map((p) => ({
        id: p.id,
        title: p.title,
      }));

    const ans = (
      await askAll({
        instructions: [res.instruction],
        prompts: filteredProducts,
      })
    ).flat() as { id: string; SEOTitle: string; SEODescription: string }[];
    // replace original products with new content
    for (const data of ans) {
      if (data.id === undefined) throw "Invalid AI response: no id.";
      if (data.SEOTitle === undefined)
        throw "Invalid AI response: no SEO Title.";
      if (data.SEODescription === undefined)
        throw "Invalid AI response: no SEO Description.";
      const p = products[parseInt(data.id)];
      products[parseInt(data.id)] = {
        ...p,
        ...data,
      };
      products[parseInt(data.id)].id = undefined;
    }
    //  store results to db & oss
    const csvContent = await dumpCSV(
      csvProducts.map((product, i) => {
        const p = products[i];
        if (product.Title !== p.title) {
          throw `Product ${product.Title} matching error.`;
        }
        return {
          ...product,
          "SEO Title": p.SEOTitle,
          "SEO Description": p.SEODescription,
          "Image Alt Text": p.SEOTitle,
        };
      }),
    );

    await s3.putObject({
      Bucket: BUCKET.name,
      Key: `outputs/SeoTask/${task.id}.csv`,
      Body: csvContent,
      ContentType: "text/csv",
    });
    await log("Successful");
    await setStatus(TaskStatus.success);
  } catch (e) {
    await log(`${e}`);
    await setStatus(TaskStatus.failure);
  }
}
