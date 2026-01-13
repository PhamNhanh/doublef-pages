export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 426 });
  }

  const room = (url.searchParams.get("room") || "lobby").toLowerCase();
  const name = (url.searchParams.get("name") || "Player").slice(0, 18);

  const id = env.MY_DURABLE_OBJECT.idFromName(room);
  const stub = env.MY_DURABLE_OBJECT.get(id);

  const forwardUrl = new URL(request.url);
  forwardUrl.pathname = "/connect";
  forwardUrl.searchParams.set("name", name);

  return stub.fetch(forwardUrl.toString(), request);
}
