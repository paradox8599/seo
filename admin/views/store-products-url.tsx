import { type controller } from "@keystone-6/core/fields/types/integer/views";
import { type FieldProps } from "@keystone-6/core/types";
import { FieldContainer } from "@keystone-ui/fields";
import { Button } from "@keystone-ui/button";

import React from "react";

export const Field = ({ itemValue }: FieldProps<typeof controller>) => {
  console.log(itemValue);
  const url = `/products?%21store_matches="${window.location.pathname.split("/")[2]}"`;
  return (
    <FieldContainer>
      <a href={url}>
        <Button>View Products</Button>
      </a>
    </FieldContainer>
  );
};
