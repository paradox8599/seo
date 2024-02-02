import { UserAuthenticationWithPasswordResult } from "../types/auth";
import { graphql } from "./base";

export async function authenticateUserWithPassword(variables: {
  email: string;
  password: string;
}) {
  const response = await graphql({
    query: /* GraphQL */ `
      mutation Mutation($email: String!, $password: String!) {
        authenticateUserWithPassword(email: $email, password: $password) {
          ... on UserAuthenticationWithPasswordSuccess {
            item {
              name
              email
              role
            }
            sessionToken
          }
          ... on UserAuthenticationWithPasswordFailure {
            message
          }
        }
      }
    `,
    variables,
  });
  return response.data
    ?.authenticateUserWithPassword as UserAuthenticationWithPasswordResult;
}
