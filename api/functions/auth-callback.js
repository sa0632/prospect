exports.handler = async function(event) {
  const { code } = event.queryStringParameters;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" })
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return { statusCode: 400, body: "Failed to get token" };

    let email = "";
    try {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const profile = await profileRes.json();
      email = profile.email || "";
    } catch(e) {
      console.error("Failed to fetch profile:", e);
    }

    const params = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || "",
      gmail_email: email
    });

    return {
      statusCode: 302,
      headers: { Location: `http://localhost:3000/?${params.toString()}` }
    };

  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};