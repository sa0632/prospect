exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!process.env.GROQ_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing GROQ_API_KEY in .env" })
    };
  }

  const { name, cat, addr } = JSON.parse(event.body);

  const prompt = `You are Helena Le, a freelance web designer in Newport News, Virginia. Write a short friendly cold outreach email to a local business owner.

Business name: ${name}
Business type: ${cat}
Address: ${addr}

Rules:
- Start with "Hi there,"
- Mention their business name and type naturally
- Say you noticed they don't have a website
- Say you build websites for local small businesses in the Hampton Roads area
- Say you put together a quick concept for them
- Mention they can check out helenaledev.com
- Ask if they want to take a look, no commitment needed
- Keep it under 200 words
- Do NOT include a subject line
- Write like a real person texting, not a marketer
- No buzzwords like "professional" or "solutions"
- Keep sentences short and punchy
- Sound like you genuinely stumbled across their business
- Never use exclamation marks
- Sign off as Helena Le with helenaledev.com and (904) 882-1248

Write only the email body, nothing else.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: data.error?.message || "Groq request failed"
        })
      };
    }

    const body = data.choices?.[0]?.message?.content?.trim();

    if (!body) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Groq returned an empty response" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `Quick idea for ${name}`,
        body
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unable to reach Groq. Check your API key and internet connection." })
    };
  }
};
