module.exports.handler = async (event) => {
  const { token, id } = event.queryStringParameters || {};
  if (!token || !id) return { statusCode: 400, body: JSON.stringify({ error: "Missing params" }) };

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const msg = await res.json();

  const headers = msg.payload?.headers || [];
  const get = (name) => headers.find(h => h.name === name)?.value || "";

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: msg.id,
      from: get("From"),
      subject: get("Subject"),
      date: get("Date"),
      body: extractBody(msg.payload)
    })
  };
};

function extractBody(payload) {
  if (!payload) return "";
  if (payload.body?.data) {
    const text = Buffer.from(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    if (payload.mimeType === "text/plain") return text;
    if (payload.mimeType === "text/html") return stripHtml(text);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return stripHtml(Buffer.from(part.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
      }
    }
    for (const part of payload.parts) {
      const result = extractBody(part);
      if (result) return result;
    }
  }
  return "";
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n").trim();
}
