export function shortId(id: string, length = 8) {
  return id.slice(-length).toUpperCase();
}
