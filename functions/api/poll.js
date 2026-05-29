export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const getcounts = async () => {
    const [v1, v2, v3] = await Promise.all([
      env.POLL_KV.get('bathroom_1'),
      env.POLL_KV.get('bathroom_2'),
      env.POLL_KV.get('bathroom_3'),
    ]);
    return {
      1: parseInt(v1 || '0'),
      2: parseInt(v2 || '0'),
      3: parseInt(v3 || '0'),
    };
  };

  if (request.method === 'GET') {
    const counts = await getcounts();
    return new Response(JSON.stringify(counts), { headers });
  }

  if (request.method === 'POST') {
    const { option } = await request.json();
    if (![1, 2, 3].includes(Number(option))) {
      return new Response(JSON.stringify({ error: 'Invalid option' }), { status: 400, headers });
    }
    const key = `bathroom_${option}`;
    const current = parseInt(await env.POLL_KV.get(key) || '0');
    await env.POLL_KV.put(key, String(current + 1));
    const counts = await getcounts();
    return new Response(JSON.stringify(counts), { headers });
  }

  return new Response('Method not allowed', { status: 405 });
}
