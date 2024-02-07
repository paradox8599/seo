import { KeystoneContext, KeystoneContextFromListTypeInfo } from "@keystone-6/core/types";
import { S3, S3ClientConfig } from "@aws-sdk/client-s3";
import { ShopifyProduct, Task, TaskStatus } from "../types/task";
import { ask } from "./openai";
import { dumpCSV, parseCSV } from "./csv_manager";
import { type Lists } from ".keystone/types";

import { BUCKET } from "../../src/lib/variables";

export const s3 = new S3({
  endpoint: BUCKET.endpointUrl,
  credentials: {
    accessKeyId: BUCKET.accessKeyId,
    secretAccessKey: BUCKET.secretAccessKey,
  }, region: "auto"
} as S3ClientConfig)

export enum Tasks {
  SeoTask = "SeoTask",
}

export class TaskQueue {
  constructor() {
    throw new Error("Cannot initialize Queue class");
  }

  static q: { [key: string]: Task[] } = {};

  static get(name: string) {
    if (!TaskQueue.q[name]) {
      return [];
    }
    return TaskQueue.q[name];
  }

  static add(name: string, item: Task) {
    if (!TaskQueue.q[name]) {
      TaskQueue.q[name] = [];
    }
    TaskQueue.q[name].push(item);
  }

  static consume(name: string) {
    if (!TaskQueue.q[name]) {
      return undefined;
    }
    return TaskQueue.q[name].shift();
  }
}

function chunkArray<T>({ arr, size }: { arr: T[], size: number }) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

async function runSeoTask(context: KeystoneContext) {
  const ctx = context as unknown as KeystoneContextFromListTypeInfo<Lists.SeoTask.TypeInfo>;
  const task = TaskQueue.consume(Tasks.SeoTask);
  if (!task) return;
  // log
  async function log(log: string) {
    if (!task) return;
    const logText = `[${new Date().toLocaleString()}] ${log}`;
    console.log(`${task.id} ${logText}`);
    const item = await ctx.query.SeoTask.findOne({
      where: { id: task.id },
      query: "logs",
    })
    await ctx.query.SeoTask.updateOne({
      where: { id: task.id },
      data: { logs: `${item.logs}\n${logText}` }
    })
  }
  async function setStatus(status: TaskStatus) {
    await ctx.query.SeoTask.updateOne({
      where: { id: task?.id ?? "" },
      data: { status }
    })
  }

  try {
    await setStatus(TaskStatus.running);
    // query stored info
    const res = await ctx.query.SeoTask.findOne({
      where: { id: task.id },
      query: "instruction inputFile { url }"
    }) as { instruction: string; inputFile: { url: string } };
    // read csv file
    const file = await fetch(res.inputFile.url);
    const csv = await file.blob();
    let products: ShopifyProduct[] = await parseCSV(await csv.text()) as ShopifyProduct[];
    // assign id to each product for recognition
    products = products.map((p, i) => ({ id: i, ...p }))
    // filter only active products with names
    const filteredProducts = products
      .filter((r) => r.Status?.toLowerCase() === "active" && r.Title.trim() !== "");
    // split products into chunks of 7
    const chunkSize = 7;
    const preparedProducts = chunkArray({ arr: filteredProducts.map((p) => ({ id: p.id, Title: p.Title })), size: chunkSize });

    console.log(`${filteredProducts.length} products, into ${preparedProducts.length} chunks of ${chunkSize}`);


    // start AI tasks
    const answers = [];
    for (let i = 0; i < preparedProducts.length; i++) {
      console.log(`Generating chunk ${i + 1} of ${preparedProducts.length}`);
      const products = preparedProducts[i];
      const answer = await ask({ instruction: res.instruction, prompt: JSON.stringify(products) });
      const finishReason = answer.choices[0].finish_reason;
      // abnormal finish reasons
      if (finishReason !== "stop") {
        throw `Fail reason: "${finishReason}", at ${i} th chunk of size ${chunkSize}.`;
      }
      answers.push(answer);
    }

    // replace original products with new content
    for (const a of answers) {
      const content = a.choices[0].message.content ?? "{}";
      console.log(content);
      const data = (content).replaceAll(/```(json)?/g, '').trim();
      const chunk = JSON.parse(data) as ShopifyProduct[];

      for (const data of chunk) {
        console.log(data);
        if (data.id === undefined) throw "Invalid AI response: no id.";
        if (data["SEO Title"] === undefined) throw "Invalid AI response: no SEO Title.";
        if (data["SEO Description"] === undefined) throw "Invalid AI response: no SEO Description.";
        const p = products[data.id];
        products[data.id] = { ...p, ...data, 'Image Alt Text': p['SEO Title'] };
        products[data.id].id = undefined;
      }

      //  store results to db & oss
      const csvContent = await dumpCSV(products);

      await s3.putObject({
        Bucket: BUCKET.name,
        Key: `outputs/SeoTask/${task.id}.csv`,
        Body: csvContent,
        ContentType: "text/csv"
      });
      await setStatus(TaskStatus.success);
      await log("Successful");
    }
  }
  catch (e) {
    await log(`${e}`);
    await setStatus(TaskStatus.failure);
  }
}

let started = false;
export async function start(ctx: KeystoneContext) {
  if (started) return;
  started = true;

  // reset seo tasks status
  const seoTaskIdResults = await (ctx as unknown as KeystoneContextFromListTypeInfo<Lists.SeoTask.TypeInfo>).query.SeoTask.findMany({
    where: { status: { in: [TaskStatus.pending, TaskStatus.running] } },
    query: "id"
  }) as { id: string }[];
  const seoTaskIds = seoTaskIdResults.map((r) => r.id);
  await (ctx as unknown as KeystoneContextFromListTypeInfo<Lists.SeoTask.TypeInfo>)
    .query.SeoTask.updateMany({
      data: seoTaskIds.map((id) => ({ where: { id }, data: { status: TaskStatus.idle } }))
    });


  console.log("AI tasks started");
  while (true) {
    await runSeoTask(ctx);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

