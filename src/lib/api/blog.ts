import { graphql } from "./base";

export async function updateBlogComment({
  id,
  comments,
}: {
  id: string;
  comments: string;
}) {
  await graphql({
    query: /* GraphQL */ `
      mutation Mutation(
        $where: BlogWhereUniqueInput!
        $data: BlogUpdateInput!
      ) {
        updateBlog(where: $where, data: $data) {
          name
          comments
        }
      }
    `,
    variables: {
      where: { id: id },
      data: { comments: comments },
    },
  });
}
