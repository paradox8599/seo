import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";

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
  const url = `/products?%21store_matches="${data.store}"&%21category_is_i="${data.category}"&%21status_is_i="ACTIVE"&%21version_is="${data.version}"`;
  return (
    <FieldContainer>
      <a href={url}>
        <Button>View Products</Button>
      </a>
    </FieldContainer>
  );
};
