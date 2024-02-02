export enum Role {
  None = 0,
  Admin = 1 << 0,
  User = 1 << 1,
  All = ~(~0 << 2),
}

export type RoleName = keyof typeof Role;

export type User = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  createdAt?: Date;
};

export type UserAuthenticationWithPasswordSuccess = {
  item: User;
  sessionToken: string;
};

export type UserAuthenticationWithPasswordFailure = {
  message: string;
};

export type UserAuthenticationWithPasswordResult =
  | UserAuthenticationWithPasswordSuccess
  | UserAuthenticationWithPasswordFailure;
