export async function api<T = { ok: boolean }>(
  path: string,
  body: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Unable to complete your request. Please try again.",
    );
  return data;
}
