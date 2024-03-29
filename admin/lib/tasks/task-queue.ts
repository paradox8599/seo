export type Task = {
  id: string;
};

export enum Tasks {
  SeoTask = "SeoTask",
  SeoFileTask = "SeoFileTask",
  BlogTask = "BlogTask",
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
    if (TaskQueue.q[name].filter((t) => t.id === item.id).length > 0) return;
    TaskQueue.q[name].push(item);
  }

  static consume(name: string) {
    if (!TaskQueue.q[name]) {
      return undefined;
    }
    return TaskQueue.q[name].shift();
  }
}
