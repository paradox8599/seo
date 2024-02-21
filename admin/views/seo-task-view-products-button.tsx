import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps } from "@keystone-6/core/types";
import { Button } from "@keystone-ui/button";
import { FieldContainer } from "@keystone-ui/fields";

import React from "react";

function ProductsButton({
  store,
  category,
  collection,
}: {
  store: string;
  category: string;
  collection?: string;
}) {
  const match = [
    `%21store_matches="${store}"`,
    `%21category_contains_i="${category}"`,
    collection ? `%21collections_matches="${collection}"` : "",
    `%21status_is_i="ACTIVE"`,
  ];

  const url = `/products?${match.join("&")}`;
  return (
    <a href={url}>
      <Button size="small">View Products</Button>
    </a>
  );
}

export const Field = ({ itemValue }: FieldProps<typeof controller>) => {
  const item = itemValue as {
    store: { value: { value: { id: string } } };
    category: { value: { initial: { value: string } } };
    collection: { value: { value?: { id: string } } };
  };
  return (
    <FieldContainer>
      <ProductsButton
        store={item.store.value.value.id}
        category={encodeURIComponent(item.category.value.initial.value)}
        collection={item.collection.value.value?.id}
      />
    </FieldContainer>
  );
};
