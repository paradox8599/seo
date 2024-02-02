export type Task = {
  id: string;
  type: string;
  task: Promise<unknown>;
};

export enum TaskStatus {
  idle = 0,
  pending = 1,
  canceled = 2,
  running = 3,
  success = 4,
  failure = 5,
}

