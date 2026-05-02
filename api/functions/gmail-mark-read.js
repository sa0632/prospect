module.exports.handler = async (event) => {
  const { token, id } = event.queryStringParameters || {};
  if (!token || !id) return { statusCode: 400, body: JSON.stringify({ error: "Missing params" }) };

  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] })
  });

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
