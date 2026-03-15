export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(`OAuth error: ${tokenData.error_description}`, { status: 400 });
  }

  const data = { token: tokenData.access_token, provider: 'github' };
  const content = `<!DOCTYPE html>
<html><body>
<script>
var data = ${JSON.stringify(data)};
window.opener.postMessage(
  'authorization:' + data.provider + ':success:' + JSON.stringify(data),
  '*'
);
window.close();
<\/script>
<p>Authenticating...</p>
</body></html>`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/html' },
  });
}
