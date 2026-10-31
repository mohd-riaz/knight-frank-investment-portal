// Only shareable portal pages are accepted as post-login destinations.
export function portalReturnTo(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/overview";
  try {
    const url = new URL(value, "https://portal.invalid");
    if (
      url.origin !== "https://portal.invalid" ||
      !["/compare", "/opportunities", "/shortlist"].includes(url.pathname)
    ) {
      return "/overview";
    }
    return url.pathname + url.search;
  } catch {
    return "/overview";
  }
}
