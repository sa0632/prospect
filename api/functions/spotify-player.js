module.exports.handler = async (event) => {
  const token = event.headers?.authorization?.split(" ")[1];

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "No token" })
    };
  }

  const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (r.status === 204) {
    return { statusCode: 204, body: JSON.stringify({ is_playing: false }) };
  }

  const data = await r.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
