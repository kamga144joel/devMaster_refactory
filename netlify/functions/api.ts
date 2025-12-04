let currentHandler: any = async function (event: any, context: any) {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: "aggregate_api_unavailable",
      message:
        "Aggregate express API is unavailable in this environment. Use direct function endpoints like /.netlify/functions/send-welcome-mail",
    }),
  };
};

let initialized = false;
let initPromise: Promise<void> | null = null;

async function ensureInit() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamically import serverless and the app at runtime (inside function invocation)
      const serverlessMod = await import("serverless-http");
      const serverless = serverlessMod.default || serverlessMod;
      const serverMod = await import("../../server");
      const createServer =
        serverMod.createServer ||
        serverMod.default ||
        serverMod.createApp ||
        serverMod.create;
      if (typeof createServer === "function") {
        currentHandler = serverless(createServer());
        initialized = true;
      }
    } catch (e) {
      // keep fallback handler if dynamic import fails
      console.warn(
        "Could not initialize aggregate express API at runtime",
        String(e),
      );
    }
  })();

  return initPromise;
}

export const handler = async (event: any, context: any) => {
  // try to initialize on first invocation without using top-level await
  await ensureInit();
  return currentHandler(event, context);
};
