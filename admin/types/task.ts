import { Tasks } from "../lib/tasks/task-queue";

export type Task = {
  id: string;
  type: Tasks;
};

export enum TaskStatus {
  idle = 0,
  pending = 1,
  canceled = 2,
  running = 3,
  success = 4,
  failure = 5,
}

export type ShopifyProduct = {
  id?: string;
  Title: string;
  "SEO Title"?: string;
  "SEO Description"?: string;
  "Image Alt Text"?: string;
  Status?: string;
  version?: number;
};
