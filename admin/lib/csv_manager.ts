import { stringify } from "csv-stringify/sync";
import { parse } from "csv-parse";
import { type Stream } from "stream";

export type CsvData = {
  readonly headers: string[];
  readonly data: string[][];
}

export async function CsvParser(data: Stream): Promise<CsvData> {
  const parser = data.pipe(parse({ delimiter: "," }));
  const records: string[][] = [];
  for await (const record of parser) {
    records.push(record);
  }
  return { headers: records[0], data: records.slice(1) }
}

export function CsvStringify(data: CsvData): string {
  return stringify([data.headers, ...data.data], { header: true });
}
