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
    return new Response(`Auth error: ${JSON.stringify(tokenData)}`, { status: 400 });
  }

  const token = tokenData.access_token;
  const provider = 'github';
  const successMessage = `authorization:${provider}:success:${JSON.stringify({ token, provider })}`;

  const content = `<!DOCTYPE html>
<html>
<head><title>Authenticating...</title></head>
<body>
<p>Completing authentication, please wait...</p>
<script>
(function() {
  var provider = 'github';
  var successMessage = ${JSON.stringify(successMessage)};

  // Step 2: when Decap CMS acknowledges, send the token back
  window.addEventListener('message', function(e) {
    if (e.data === 'authorizing:' + provider) {
      window.opener.postMessage(successMessage, '*');
      setTimeout(function() { window.close(); }, 500);
    }
  });

  // Step 1: announce to Decap CMS that we're ready
  var attempts = 0;
  function announce() {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage('authorizing:' + provider, '*');
      attempts++;
      if (attempts < 30) {
        setTimeout(announce, 200);
      }
    }
  }

  announce();
})();
<\/script>
</body>
</html>`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/html' },
  });
}
