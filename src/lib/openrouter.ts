import { z } from "zod";
import { setTimeout as sleep } from "node:timers/promises";

export class AssistantServiceError extends Error {}
const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

export function retryDelay(
  attempt: number,
  retryAfter: string | null,
  now = Date.now(),
  random = Math.random(),
): number {
  const backoff = 1000 * 2 ** attempt + Math.floor(random * 250);
  if (!retryAfter) return backoff;
  const value = retryAfter.trim();
  const suggested = /^\d+(?:\.\d+)?$/.test(value)
    ? Number(value) * 1000
    : Date.parse(value) - now;
  return Number.isFinite(suggested) ? Math.max(backoff, suggested) : backoff;
}

export async function completion<T>(
  schema: z.ZodType<T>,
  name: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: {
    key: string;
    model: string;
    signal: AbortSignal;
    fetcher?: typeof fetch;
    maxRetries?: number;
    deadlineAt?: number;
    wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
  },
): Promise<T> {
  // Construct once so retries repeat only this model call, not the database search.
  const request = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.key}`,
      "Content-Type": "application/json",
    },
    signal: options.signal,
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: 0.2,
      max_tokens: 1800,
      provider: { require_parameters: true },
      response_format: {
        type: "json_schema",
        json_schema: { name, strict: true, schema: z.toJSONSchema(schema) },
      },
    }),
  };
  const maxRetries = Math.min(3, Math.max(0, options.maxRetries ?? 0));
  const deadlineAt = options.deadlineAt ?? Infinity;
  for (let attempt = 0; ; attempt++) {
    options.signal.throwIfAborted();
    if (Date.now() >= deadlineAt)
      throw new DOMException("Assistant deadline exceeded", "TimeoutError");
    let response: Response | undefined;
    let failure: unknown;
    let retryable = false;
    try {
      response = await (options.fetcher ?? fetch)(
        "https://openrouter.ai/api/v1/chat/completions",
        request,
      );
      if (response.ok) {
        const data = await response.json();
        const choice = data?.choices?.[0];
        if (
          choice?.finish_reason !== "stop" ||
          typeof choice?.message?.content !== "string"
        )
          throw new AssistantServiceError(
            "The assistant could not interpret that request. Please try rephrasing it.",
          );
        try {
          return schema.parse(JSON.parse(choice.message.content));
        } catch {
          throw new AssistantServiceError(
            "The assistant could not interpret that request. Please try rephrasing it.",
          );
        }
      }
      failure = new AssistantServiceError(
        response.status === 429
          ? "The assistant is busy. Please wait a moment and try again."
          : "The AI service is unavailable. Please use the portal filters or try again shortly.",
      );
      retryable = retryableStatuses.has(response.status);
      // Release failed responses before another attempt opens a connection.
      await response.body?.cancel().catch(() => {});
    } catch (error) {
      options.signal.throwIfAborted();
      // Fetch reports connection failures as TypeError. Validation and cancellation
      // errors must not generate additional paid requests.
      retryable = error instanceof TypeError;
      failure =
        error instanceof AssistantServiceError
          ? error
          : new AssistantServiceError(
              retryable
                ? "The AI service is unavailable. Please try again shortly."
                : "The assistant could not interpret that request. Please try rephrasing it.",
            );
    }
    if (!retryable || attempt >= maxRetries) throw failure;
    const delay = retryDelay(
      attempt,
      response?.headers.get("retry-after") ?? null,
    );
    // Never shorten a provider's Retry-After to squeeze in an extra attempt.
    if (Date.now() + delay >= deadlineAt) throw failure;
    try {
      await (
        options.wait ?? ((ms, signal) => sleep(ms, undefined, { signal }))
      )(delay, options.signal);
    } catch (error) {
      options.signal.throwIfAborted();
      throw error;
    }
  }
}
