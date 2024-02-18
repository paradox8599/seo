import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps } from "@keystone-6/core/types";
import { Button } from "@keystone-ui/button";
import { FieldContainer } from "@keystone-ui/fields";

import React from "react";

function ProductsButton({
  store,
  category,
  version,
}: {
  store: string;
  category: string;
  version: number;
}) {
  const url = `/products?%21store_matches="${store}"&%21category_contains_i="${category}"&%21status_is_i="ACTIVE"&%21version_is="${version}"`;
  return (
    <a href={url}>
      <Button size="small">View Products</Button>
    </a>
  );
}

export const Field = ({ itemValue }: FieldProps<typeof controller>) => {
  const item = itemValue as {
    version: { value: { value: number } };
    store: { value: { value: { id: string } } };
    category: { value: { initial: { value: string } } };
  };
  const data = {
    version: item.version.value.value,
    store: item.store.value.value.id,
    category: encodeURIComponent(item.category.value.initial.value),
  };
  return (
    <FieldContainer>
      <ProductsButton
        store={data.store}
        category={data.category}
        version={data.version}
      />
    </FieldContainer>
  );
};
