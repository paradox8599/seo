import { type Context } from ".keystone/types";
import { TaskStatus } from "../../../types/task";
import { TaskQueue, Tasks } from "../task-queue";
import { generateArticle } from "./generations";

export async function resetBlogTasks(ctx: Context) {
  const blogIdResults = (await ctx.sudo().query.BlogFromUrl.findMany({
    where: { status: { in: [TaskStatus.pending, TaskStatus.running] } },
    query: "id",
  })) as { id: string }[];
  const blogIds = blogIdResults.map((r) => r.id);
  await ctx.sudo().query.BlogFromUrl.updateMany({
    data: blogIds.map((id) => ({
      where: { id },
      data: { status: TaskStatus.idle },
    })),
  });
}

export async function runBlogTask(context: Context) {
  const task = TaskQueue.consume(Tasks.BlogTask);
  if (!task) return;
  const ctx = context.sudo();

  async function log(log: string) {
    if (!task) return;
    const logText = `[${new Date().toLocaleString("en-AU")}] Blog Task: ${log}`;
    console.log(`${task.id} ${logText}`);
  }

  async function setStatus(status: TaskStatus) {
    if (!task) return;
    await ctx.query.BlogFromUrl.updateOne({
      where: { id: task.id },
      data: { status },
    });
  }

  try {
    setStatus(TaskStatus.running);
    await generateArticle({ id: task.id, context: ctx });
    setStatus(TaskStatus.success);
  } catch (e) {
    await log(`${e}`);
    await setStatus(TaskStatus.failure);
  }
}
