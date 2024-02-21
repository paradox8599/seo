import { Blog } from "./Blog";
import { Collection } from "./Collection";
import { Instruction } from "./Instruction";
import { Product } from "./Products";
import { SeoFileTask } from "./SeoFileTask";
import { SeoTask } from "./SeoTask";
import { Store } from "./Store";
import { User } from "./User";
import { type Lists } from ".keystone/types";

export const lists: Lists = {
  Instruction,
  User,
  Store,
  Collection,
  Product,
  SeoTask,
  SeoFileTask,
  Blog,
};
