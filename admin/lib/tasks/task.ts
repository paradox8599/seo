import { KeystoneContext } from "@keystone-6/core/types";

import { resetSeoTasks, runSeoTask } from "./seo-task";

export function chunkArray<T>({ arr, size }: { arr: T[]; size: number }) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

let started = false;
export async function start(ctx: KeystoneContext) {
  if (started) return;
  started = true;

  // reset seo tasks status
  await resetSeoTasks(ctx);

  console.log("AI tasks started");
  while (true) {
    await runSeoTask(ctx);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}