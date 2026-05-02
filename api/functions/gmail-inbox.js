module.exports.handler = async (event) => {
  const { token, type } = event.queryStringParameters || {};
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: "No token" }) };

  if (type === "drafts") {
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=100",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();
    if (!listData.drafts) return { statusCode: 200, body: JSON.stringify([]) };

    const drafts = await Promise.all(
      listData.drafts.map(async ({ id }) => {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${id}?format=metadata&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const d = await res.json();
        const headers = d.message?.payload?.headers || [];
        const get = (name) => headers.find(h => h.name === name)?.value || "";
        return {
          id: d.message?.id || id,
          from: `To: ${get("To") || "(no recipient)"}`,
          subject: get("Subject") || "(no subject)",
          date: get("Date"),
          snippet: d.message?.snippet || "",
          unread: false,
          isDraft: true
        };
      })
    );
    return { statusCode: 200, body: JSON.stringify(drafts) };
  }

  // Primary inbox only (excludes Promotions, Social, Updates, Forums)
  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox -category:promotions -category:social -category:updates -category:forums&maxResults=100",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const listData = await listRes.json();
  if (!listData.messages) return { statusCode: 200, body: JSON.stringify([]) };

  const messages = await Promise.all(
    listData.messages.map(async ({ id }) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msg = await msgRes.json();
      const headers = msg.payload?.headers || [];
      const get = (name) => headers.find(h => h.name === name)?.value || "";
      return {
        id,
        from: get("From"),
        subject: get("Subject"),
        date: get("Date"),
        snippet: msg.snippet || "",
        unread: (msg.labelIds || []).includes("UNREAD")
      };
    })
  );

  return { statusCode: 200, body: JSON.stringify(messages) };
};
