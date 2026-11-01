// Used only by assistant.integration.test.ts in its isolated server process.
const originalFetch = globalThis.fetch;
let recoveryAttempts = 0;
globalThis.fetch = async (url, options) => {
  if (String(url) !== "https://openrouter.ai/api/v1/chat/completions")
    return originalFetch(url, options);
  const body = JSON.parse(options.body);
  let result;
  if (body.response_format.json_schema.name === "opportunity_answer") {
    const input = JSON.parse(body.messages.at(-1).content);
    if (input.question === "summary unavailable")
      return Response.json({}, { status: 503 });
    result = {
      text: "These sample opportunities meet your selected criteria.",
    };
  } else {
    const input = JSON.parse(body.messages.at(-1).content);
    if (input.message === "provider failure")
      return Response.json({}, { status: 429 });
    if (
      input.message === "recover after three failures" &&
      ++recoveryAttempts <= 3
    )
      return Response.json({}, { status: 503 });
    result = {
      action: "search",
      clarification: "",
      filters: input.previous?.filters ?? {
        region: ["UK"],
        country: [],
        asset: ["Offices"],
        query: "Assistant integration fixture",
        min: "",
        max: "20",
        currency: "GBP",
        yield: "6",
        tenure: "Any tenure",
      },
      sort: "yield_desc",
      compare: true,
      limit: 3,
      ids: [],
    };
    if (input.message === "only freehold") result.filters.tenure = "Freehold";
    if (input.message === "no matches") result.filters.currency = "AED";
  }
  return Response.json({
    choices: [
      { finish_reason: "stop", message: { content: JSON.stringify(result) } },
    ],
  });
};
