export function getPagination(page: number, size: number) {
  const limit = size;
  const from = page * limit;
  const to = from + size - 1;

  return { from, to };
}
