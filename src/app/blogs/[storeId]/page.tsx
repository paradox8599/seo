import { keystoneContext as ctx } from "@/keystone/context";
import { Card, CardFooter, CardHeader, Chip } from "@nextui-org/react";
import _ from "lodash";

export default async function Blogs({
  params,
}: {
  params: { storeId: string };
}) {
  const blogs = (await ctx.sudo().query.Blog.findMany({
    where: { store: { id: { equals: params.storeId } } },
    query: "id name version parent { id } createdAt updatedAt approved",
  })) as unknown as {
    id: string;
    version: number;
    name: string;
    parent: { id: string };
    createdAt: string;
    updatedAt: string;
    approved: boolean;
  }[];

  // fetch all blogs
  type Blog = (typeof blogs)[number];
  // group blogs by parentId
  const blogGroups = blogs.reduce(
    (acc, blog) => {
      const id = blog.parent?.id ?? blog.id;
      if (acc[id] === undefined) acc[id] = [];
      acc[id].push(blog);
      return acc;
    },
    {} as { [key: string]: Blog[] },
  );
  // order blogs and get latest versions
  for (const id in blogGroups) {
    blogGroups[id].sort((a, b) => b.version - a.version);
    blogGroups[id].splice(1);
  }
  const latestBlogs = Object.values(blogGroups).flat();

  return (
    <main className="w-full flex justify-center items-center py-4">
      <section className="container flex flex-col gap-2">
        {latestBlogs.map((blog) => (
          <a key={blog.id} href={`/blog/${blog.id}`}>
            <Card shadow="sm">
              <CardHeader>
                <Chip size="sm" className="shadow-inner">
                  v{blog.version}
                </Chip>
                <p className="mx-2">{blog.name}</p>
              </CardHeader>
              <CardFooter>
                <div>
                  <p>updated at: {new Date(blog.updatedAt).toLocaleString()}</p>
                  <p>created at: {new Date(blog.createdAt).toLocaleString()}</p>
                </div>
              </CardFooter>
            </Card>
          </a>
        ))}
      </section>
    </main>
  );
}
