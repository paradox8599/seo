import { parseString, writeToString, FormatterRow } from 'fast-csv';

export async function parseCSV(data: string): Promise<FormatterRow[]> {
  return await parseString(data, { headers: true }).toArray();
}

export async function dumpCSV(data: FormatterRow[]) {
  return await writeToString(data, { headers: true });
}

