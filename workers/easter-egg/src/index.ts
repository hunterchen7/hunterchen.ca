export interface Env {
  EASTER_EGG: KVNamespace;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const current = parseInt((await env.EASTER_EGG.get("count")) || "0");
    const newCount = current + 1;
    await env.EASTER_EGG.put("count", newCount.toString());

    return new Response(JSON.stringify({ count: newCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
