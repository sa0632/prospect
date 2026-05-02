exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { accessToken, to, subject, body } = JSON.parse(event.body);

  // Build the raw RFC 2822 email
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body
  ].join('\n');

  const encoded = Buffer.from(emailLines)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: { raw: encoded } })
    });

    const data = await res.json();

    if (data.error) {
      return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, draftId: data.id })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  
  if (pathname === "/api/send-direct") {
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", async () => {
    const event = { httpMethod: "POST", body };
    const result = await sendDirect.handler(event);
    res.writeHead(result.statusCode, { "Content-Type": "application/json" });
    res.end(result.body);
  });
  return;
}
  }
};