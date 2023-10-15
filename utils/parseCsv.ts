import { parse } from "csv-parse/browser/esm/sync";

export async function parseCsv({
  file,
  options,
}: {
  file: Blob;
  options: { start: number; end: number };
}) {
  const decoder = new TextDecoder();

  const reader = file.stream().getReader();

  const { value } = await reader.read();

  const chunk = decoder.decode(value);

  const lines = chunk.split("\n").slice(options.start, options.end).join("\n");

  return parse(lines);
}
