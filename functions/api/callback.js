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

  if (tokenData.error || !tokenData.access_token) {
    return new Response(`Auth error: ${tokenData.error_description || tokenData.error || 'Unknown error'}`, { status: 400 });
  }

  const token = tokenData.access_token;
  const provider = 'github';
  const message = `authorization:${provider}:success:${JSON.stringify({ token, provider })}`;

  const content = `<!DOCTYPE html>
<html><body>
<script>
(function() {
  var message = ${JSON.stringify(message)};
  function sendMessage() {
    if (window.opener) {
      window.opener.postMessage(message, '*');
      setTimeout(function() { window.close(); }, 500);
    } else {
      document.body.innerHTML = '<p>Authentication failed: no opener window. Please close this and try again.</p>';
    }
  }
  if (document.readyState === 'complete') {
    sendMessage();
  } else {
    window.addEventListener('load', sendMessage);
  }
})();
<\/script>
<p>Authenticating, please wait...</p>
</body></html>`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/html' },
  });
}
