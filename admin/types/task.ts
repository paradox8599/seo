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
  title?: string;
  SEOTitle?: string;
  SEODescription?: string;
  status?: string;
  version?: number;
};
