
export type Task = {
  id: string;
  type: 'SeoTask';
  instruction: string;
  data: unknown;
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
  Title: string;
  "SEO Title"?: string;
  "SEO Description"?: string;
  "Image Alt Text"?: string;
  Status?: string;
}
