function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return withSecurityHeaders(response);

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if ((request.method === "GET" || request.method === "HEAD") && acceptsHtml) {
      const indexUrl = new URL("/index.html", request.url);
      const indexResponse = await env.ASSETS.fetch(new Request(indexUrl, request));
      return withSecurityHeaders(indexResponse);
    }

    return withSecurityHeaders(response);
  },
};

export default worker;
