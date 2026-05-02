exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { accessToken, to, subject, body } = JSON.parse(event.body);

  if (!accessToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "No access token" }) };
  }

  if (!to || !to.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid recipient" }) };
  }

  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    body
  ].join("\r\n");

  const encoded = Buffer.from(emailLines)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encoded })
    });

    const data = await res.json();
    console.log("Gmail send response:", JSON.stringify(data));

    if (data.error) {
      return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, messageId: data.id }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
