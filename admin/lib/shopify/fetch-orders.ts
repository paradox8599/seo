import moment, { Moment } from "moment";
import { getOrders } from "./graphql";

export async function getOrdersFrom({
  store,
  adminAccessToken,
  from = moment(new Date(0)),
  to = moment(),
}: {
  store: string;
  adminAccessToken: string;
  from?: Moment;
  to?: Moment;
}) {
  const orders = [];
  for (
    let hasNext = true, after: string | undefined | null = void 0, i = 1;
    // conditions
    after !== null && hasNext;
    i++
  ) {
    console.log(`Getting page ${i} of ${store} orders`);
    const data = await getOrders({ store, adminAccessToken, after, from, to });
    if (data?.errors || data?.data?.errors || !data?.data?.orders) {
      throw JSON.stringify(data?.errors ?? data?.data?.errors);
    }
    const pageOrders = data.data.orders.edges.map((e) => e.node);
    orders.push(...pageOrders);
    after = data.data.orders.pageInfo.endCursor;
    hasNext = data.data.orders.pageInfo.hasNextPage;
  }
  return orders;
}
