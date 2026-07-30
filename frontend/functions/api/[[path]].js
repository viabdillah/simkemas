export async function onRequest(context) {
  const url = new URL(context.request.url);
  const backendUrl = new URL("https://simkemas-api.pages.dev" + url.pathname + url.search);
  const newRequest = new Request(backendUrl.toString(), context.request);

  try {
    return await fetch(newRequest);
  } catch (error) {
    console.error("Smart Proxy Error:", error);
    return new Response(JSON.stringify({
      ok: false,
      error: "Smart Proxy Gagal menyambung ke Backend"
    }), { status: 502 });
  }
}