import { Role } from "../../src/lib/types/auth";

export function isRole(role: Role) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return ({ session }: any) => {
    return ((session?.data.role ?? 0) & role) > 0;
  };
}

export const isAdmin = isRole(Role.Admin);
export const isNotAdmin = isRole(~Role.Admin);
