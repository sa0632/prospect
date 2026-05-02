module.exports.handler = async (event) => {
  const code = event.queryStringParameters?.code;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI
    })
  });

  const data = await tokenRes.json();

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return {
    statusCode: 302,
    headers: {
      Location: `${appUrl}/?spotify_token=${data.access_token}`
    }
  };
};