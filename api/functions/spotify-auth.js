module.exports.handler = async () => {
  const scope =
    "user-read-playback-state user-modify-playback-state user-read-currently-playing";

  const url =
    "https://accounts.spotify.com/authorize" +
    "?client_id=" + process.env.SPOTIFY_CLIENT_ID +
    "&response_type=code" +
    "&redirect_uri=" + encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI) +
    "&scope=" + encodeURIComponent(scope);

  return {
    statusCode: 302,
    headers: {
      Location: url
    }
  };
};