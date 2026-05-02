exports.handler = async function(event) {
  const { category, city } = event.queryStringParameters;
  const key = process.env.GOOGLE_PLACES_KEY;

  if (!category || !city) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing category or city' })
    };
  }

  if (!key) {
    console.error('GOOGLE_PLACES_KEY is not set in environment');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    // Step 1: search for businesses
    console.log(`Searching for: ${category} in ${city}`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(category + ' in ' + city)}&key=${key}`
    );
    const searchData = await searchRes.json();

    if (searchData.error_message) {
      console.error('Google Places API error:', searchData.error_message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: searchData.error_message })
      };
    }

    if (!searchData.results || searchData.results.length === 0) {
      console.log('No results found');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      };
    }

    // Step 2: filter to no website, get details for each
    const results = [];

    for (const place of searchData.results.slice(0, 15)) {
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,types&key=${key}`
      );
      const detailData = await detailRes.json();

      if (detailData.error_message) {
        console.error('Error fetching details:', detailData.error_message);
        continue;
      }

      const p = detailData.result;
      if (!p) continue;

      // only include if no website
      if (!p.website) {
        results.push({
          id: place.place_id,
          name: p.name,
          addr: p.formatted_address,
          phone: p.formatted_phone_number || 'N/A',
          cat: category,
          tags: p.types?.slice(0, 3).map(t => t.replace(/_/g, ' ')) || [],
          score: Math.floor(Math.random() * 20) + 78
        });
      }
    }

    console.log(`Found ${results.length} businesses with no website`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    };

  } catch (err) {
    console.error('Search error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};