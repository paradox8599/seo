import type { AdminConfig } from "@keystone-6/core/types";
import { Navi } from "./navi";

export const components: AdminConfig["components"] = {
  Logo: () => <h1>Admin</h1>,
  Navigation: Navi,
};
