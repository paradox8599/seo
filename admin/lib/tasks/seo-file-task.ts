import { KeystoneContext } from "@keystone-6/core/types";
import { ShopifyProduct, TaskStatus } from "../../types/task";
import { ask } from "../openai";
import { dumpCSV, parseCSV } from "../csv_manager";

import { BUCKET } from "../../../src/lib/variables";
import { TaskQueue, Tasks } from "./task-queue";
import { s3 } from "./s3";
import { chunkArray } from "./task";
import { type Context } from ".keystone/types";

export async function resetSeoFileTasks(ctx: KeystoneContext) {
  const seoTaskIdResults = (await (
    ctx as unknown as Context
  ).query.SeoFileTask.findMany({
    where: { status: { in: [TaskStatus.pending, TaskStatus.running] } },
    query: "id",
  })) as { id: string }[];
  const seoTaskIds = seoTaskIdResults.map((r) => r.id);
  await (ctx as unknown as Context).query.SeoFileTask.updateMany({
    data: seoTaskIds.map((id) => ({
      where: { id },
      data: { status: TaskStatus.idle },
    })),
  });
}

export async function runSeoFileTask(context: KeystoneContext) {
  const ctx = context as unknown as Context;
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
    let products: ShopifyProduct[] = (await parseCSV(
      await csv.text(),
    )) as ShopifyProduct[];
    // assign id to each product for recognition
    products = products.map((p, i) => ({ id: `${i}`, ...p }));
    // filter only active products with names
    const filteredProducts = products.filter(
      (r) => r.Status?.toLowerCase() === "active" && r.Title.trim() !== "",
    );
    // split products into chunks of 7
    const chunkSize = 7;
    const preparedProducts = chunkArray({
      arr: filteredProducts.map((p) => ({ id: p.id, Title: p.Title })),
      size: chunkSize,
    });

    console.log(
      `${task.id}` +
        ` ${filteredProducts.length} products,` +
        ` into ${preparedProducts.length} chunks of ${chunkSize}`,
    );

    // start AI tasks
    const answers = [];
    for (let i = 0; i < preparedProducts.length; i++) {
      console.log(
        `${task.id} Generating chunk ${i + 1} of ${preparedProducts.length}`,
      );
      const products = preparedProducts[i];
      const answer = await ask({
        instruction: res.instruction,
        prompt: JSON.stringify(products),
      });
      const finishReason = answer.choices[0].finish_reason;
      // abnormal finish reasons
      if (finishReason !== "stop") {
        throw (
          `Fail reason: "${finishReason}",` +
          ` at ${i} th chunk of size ${chunkSize}.`
        );
      }
      answers.push(answer);
    }

    // replace original products with new content
    for (const a of answers) {
      const content = a.choices[0].message.content ?? "{}";
      const data = content.replaceAll(/```(json)?/g, "").trim();
      const chunk = JSON.parse(data) as ShopifyProduct[];

      for (const data of chunk) {
        if (data.id === undefined) throw "Invalid AI response: no id.";
        if (data["SEO Title"] === undefined)
          throw "Invalid AI response: no SEO Title.";
        if (data["SEO Description"] === undefined)
          throw "Invalid AI response: no SEO Description.";
        const p = products[parseInt(data.id)];
        products[parseInt(data.id)] = {
          ...p,
          ...data,
          "Image Alt Text": data["SEO Title"],
        };
        products[parseInt(data.id)].id = undefined;
      }
    }
    //  store results to db & oss
    const csvContent = await dumpCSV(products);

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
