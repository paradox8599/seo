import React from "react";

export function useJson<T>({
  value,
  onChange,
  initialValue = {},
}: {
  value: string;
  onChange?: (value: string) => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  initialValue?: any;
}) {
  const [data, setData] = React.useState<T>(
    value ? JSON.parse(value) : initialValue,
  );

  React.useEffect(() => {
    onChange?.(JSON.stringify(data));
  }, [data, onChange]);

  return { data: data as T, setData };
}
