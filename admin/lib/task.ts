import { ShopifyProduct, Task } from "../types/task";
import { ask } from "./openai";

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

  static read(name: string) {
    if (!TaskQueue.q[name]) {
      return undefined;
    }
    return TaskQueue.q[name].shift();
  }
}

function chunkArray<T>({ arr, size }: { arr: T[], size: number }) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

}

async function runSeoTask() {
  const task = TaskQueue.read("SEOTask");
  if (!task) return;
  const products = task.data as ShopifyProduct[];
  const preparedProducts = chunkArray({
    arr: products.map((p) => ({ Title: p.Title })),
    size: 7,
  });

  const answers = [];
  for (const products of preparedProducts) {
    await ask({ instruction: task.instruction, prompt: "" });
  }

}

let started = false;
export async function start() {
  if (started) return;
  started = true;
  while (true) {

  }
}

