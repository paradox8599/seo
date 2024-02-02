import { keystoneContext } from "@/keystone/context";

export default async function Home() {
  const data = await keystoneContext.query.User.count();
  return (
    <>
      <p>users: {JSON.stringify(data)}</p>
    </>
  );
}
