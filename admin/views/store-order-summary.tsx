import { type controller } from "@keystone-6/core/fields/types/json/views";
import { type FieldProps } from "@keystone-6/core/types";
import { Button } from "@keystone-ui/button";
import { DatePicker, FieldContainer, FieldLabel } from "@keystone-ui/fields";

import React from "react";
import { useJson } from "./hooks/useJson";
import moment from "moment";
import { Order } from "../lib/shopify/graphql";

type OrderSummary = {
  fromDate: string;
  toDate?: string;
  total: number;
  states: { [state: string]: number };
};

const initialValue: OrderSummary = {
  fromDate: "1970-01-01",
  total: 0,
  states: {},
};

function Summary({ orders }: { orders: Order[] }) {
  const states = React.useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const state = order.billingAddress?.provinceCode ?? "unspecified";
        acc[state] ??= [];
        acc[state].push(order);
        return acc;
      },
      {} as { [key: string]: Order[] },
    );
  }, [orders]);

  function getSources(orders: Order[]) {
    return orders.reduce(
      (acc, order) => {
        const source =
          order.customerJourneySummary?.firstVisit?.source ?? "unspecified";
        acc[source] ??= [];
        acc[source].push(order);
        return acc;
      },
      {} as { [key: string]: Order[] },
    );
  }
  // const sources = React.useMemo(() => getSources(orders), [orders]);

  const firstOrders = React.useMemo(() => {
    return orders.filter(
      (o) => o.customerJourneySummary?.customerOrderIndex === 1,
    );
  }, [orders]);

  const firstOrderSources = React.useMemo(
    () => getSources(firstOrders),
    [firstOrders],
  );

  return (
    <div className="summary">
      <style>{`
        .summary table, .summary th, .summary td {
          border: 1px solid black;
        }
        .summary th, .summary td {
          padding: 0 0.2rem;
          text-align: center;
        }
        .summary table {
          border-collapse: collapse;
        }
      `}</style>
      <p style={{ display: "flex", gap: "1rem" }}>
        <span>Total: {orders.length}</span>
        <span>
          First Orders: {firstOrders.length} (
          {Math.floor((firstOrders.length / orders.length) * 100)}%)
        </span>
      </p>
      <div style={{ display: "flex", alignItems: "start", gap: "1rem" }}>
        <div>
          <table>
            <tr>
              <th>Source</th>
              <th>First Order</th>
              <th>%</th>
            </tr>
            {Object.keys(firstOrderSources).map((source) => (
              <tr key={source}>
                <td>{source}</td>
                <td>{firstOrderSources[source].length}</td>
                <td>
                  {Math.floor(
                    (firstOrderSources[source].length / firstOrders.length) *
                    100,
                  )}
                  %
                </td>
              </tr>
            ))}
          </table>
        </div>
        <div>
          <table>
            <tr>
              <th>State</th>
              <th>Count</th>
              <th>%</th>
            </tr>
            {Object.keys(states).map((state) => (
              <tr key={state}>
                <td>{state}</td>
                <td>{states[state].length}</td>
                <td>
                  {Math.floor((states[state].length / orders.length) * 100)}%
                </td>
              </tr>
            ))}
          </table>
        </div>
      </div>
    </div>
  );
}

export const Field = ({
  value,
  onChange,
  field,
}: FieldProps<typeof controller>) => {
  const { data, setData } = useJson<OrderSummary>({
    value,
    onChange,
    initialValue,
  });
  const summary = React.useMemo(
    () => ({
      ...data,
      fromDate: moment(data.fromDate),
      toDate: moment(data.toDate),
    }),
    [data],
  );
  const updateSummary = React.useCallback(
    (data: Partial<OrderSummary>) => {
      setData((prev) => ({
        ...prev,
        ...data,
      }));
    },
    [setData],
  );
  const id = window.location.pathname.split("/").toReversed()[0];
  const [orders, setOrders] = React.useState<Order[]>([]);

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          margin: "1rem 0",
        }}
      >
        <Button
          onClick={async () => {
            const res = await fetch(
              `/api/orders/summary?id=${id}&from=${summary.fromDate.unix()}&to=${summary.toDate.unix()}`,
              { method: "POST" },
            );
            if (!res.ok) {
              alert(`Request error: ${res.statusText}`);
              return;
            }
            const data = await res.json();
            if (data.error) {
              alert(`Request error: ${data.error}`);
              return;
            }
            if (data.data) {
              setOrders(data.data.orders);
            }
          }}
        >
          Fetch
        </Button>
        <span>From</span>
        <DatePicker
          value={summary.fromDate.format("YYYY-MM-DD")}
          onClear={() => updateSummary({ fromDate: "1970-01-01" })}
          onUpdate={(value) => updateSummary({ fromDate: value })}
        />
        <span>To</span>
        <DatePicker
          value={summary.toDate.format("YYYY-MM-DD")}
          onClear={() =>
            updateSummary({ toDate: moment().format("YYYY-MM-DD") })
          }
          onUpdate={(value) => updateSummary({ toDate: value })}
        />
      </div>
      <Summary orders={orders} />
    </FieldContainer>
  );
};
