import { keystoneContext as ctx } from "@/keystone/context";

export default async function Blogs({
  params,
}: {
  params: { storeId: string };
}) {
  const blogs = await ctx.sudo().prisma.blog.findMany({
    where: { storeId: { equals: params.storeId } },
  });

  return <pre>{JSON.stringify(blogs, null, 2)}</pre>;
}
