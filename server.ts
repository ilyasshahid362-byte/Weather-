import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. Falling back to local curation engine.");
}

// Curated Local Vibe Fallbacks in case Gemini is not configured or fails
const LOCAL_VIBE_FALLBACKS: Record<string, any> = {
  Clear: {
    vibeDescription: "The sky is bright and golden. Perfect for warm acoustic strings, breezy indie pop, and uplifting beats that carry the energy of the sun.",
    spotifyPlaylistId: "37i9dQZF1DX1BzILRveYHb", // Feel Good Indie
    tracks: [
      { title: "Sunflower", artist: "Post Malone & Swae Lee", reason: "Sun-drenched, feel-good energy matching the clear blue skies.", genre: "Indie Pop", mood: "Uplifting" },
      { title: "Put Your Records On", artist: "Corinne Bailey Rae", reason: "Breezy acoustic melodies that feel like warm sunlight on your shoulders.", genre: "Acoustic / Soul", mood: "Relaxed" },
      { title: "Solar Power", artist: "Lorde", reason: "An airy, sun-worshipping anthem that celebrates bright clear days.", genre: "Indie Pop", mood: "Joyful" },
      { title: "Here Comes The Sun", artist: "The Beatles", reason: "The timeless tribute to a clear, bright morning.", genre: "Classic Rock", mood: "Optimistic" },
      { title: "Walking on Sunshine", artist: "Katrina and the Waves", reason: "Upbeat brass and pure joy to match the radiant heat.", genre: "Pop Rock", mood: "Energetic" }
    ]
  },
  Clouds: {
    vibeDescription: "Overcast skies bring a calm, reflective stillness. A perfect backdrop for cozy lo-fi beats, warm keys, and intimate indie acoustics.",
    spotifyPlaylistId: "37i9dQZF1DX3rxVf6vfhns", // Chilling Top Tracks
    tracks: [
      { title: "re:stacks", artist: "Bon Iver", reason: "Delicate acoustic layers that wrap around you like a heavy, overcast sky.", genre: "Indie Folk", mood: "Contemplative" },
      { title: "Vanilla", artist: "Tycho", reason: "Dreamy, atmospheric ambient synth layers that match the gray canvas above.", genre: "Electronic", mood: "Mellow" },
      { title: "We Find Each Other in the Dark", artist: "Novo Amor", reason: "Soaring, falsetto-led folk that mirrors the quiet, cloud-veiled world.", genre: "Indie Folk", mood: "Dreamy" },
      { title: "To Noise Making (Sing)", artist: "Hozier", reason: "Soulful and grounded melodies perfect for cozy gray days.", genre: "Indie Soul", mood: "Warm" },
      { title: "Sunset Lover", artist: "Petit Biscuit", reason: "Soft, gentle electronic waves that bring warmth to overcast moments.", genre: "Chilled Electronic", mood: "Relaxed" }
    ]
  },
  Rain: {
    vibeDescription: "The rhythm of the raindrops calls for a slower tempo. Think moody jazz, warm piano keys, and cozy acoustic melodies to watch the storm pass.",
    spotifyPlaylistId: "37i9dQZF1DX4sWSpwq3LiO", // Atmospheric Calm
    tracks: [
      { title: "Riders on the Storm", artist: "The Doors", reason: "Classic, jazz-infused rock with real rain soundscapes weaving through.", genre: "Psychedelic Rock", mood: "Moody" },
      { title: "Rosyln", artist: "Bon Iver & St. Vincent", reason: "An ethereal, dark acoustic blend perfect for watching raindrops slide down the window.", genre: "Indie Folk", mood: "Melancholic" },
      { title: "Blue in Green", artist: "Miles Davis", reason: "Intimate modal jazz that feels like a rain-slicked city street at midnight.", genre: "Jazz", mood: "Somber / Cool" },
      { title: "Come Away With Me", artist: "Norah Jones", reason: "Gentle piano and smoky vocals that invite you to stay cozy indoors.", genre: "Vocal Jazz", mood: "Cozy" },
      { title: "Banana Pancakes", artist: "Jack Johnson", reason: "A playful acoustic tune about turning a rainy day into a cozy indoor retreat.", genre: "Acoustic Pop", mood: "Warm" }
    ]
  },
  Drizzle: {
    vibeDescription: "A soft, misty rain. Best accompanied by delicate, fingerpicked acoustics, gentle ambient synths, and soft dream-pop vocals.",
    spotifyPlaylistId: "37i9dQZF1DX4sWSpwq3LiO", // Atmospheric Calm
    tracks: [
      { title: "Skinny Love", artist: "Bon Iver", reason: "Fragile, raw acoustic chords that fit a quiet, misty morning.", genre: "Indie Folk", mood: "Raw" },
      { title: "First Day of My Life", artist: "Bright Eyes", reason: "Sweet, acoustic-guitar fingerpicking that feels soft and comforting.", genre: "Indie Folk", mood: "Heartwarming" },
      { title: "Space Song", artist: "Beach House", reason: "Soaring dream-pop synths that carry a gentle, misty melancholy.", genre: "Dream Pop", mood: "Dreamy" },
      { title: "Holocene", artist: "Bon Iver", reason: "Sparsely beautiful layers of acoustics that paint a picture of cold dew and mist.", genre: "Indie Folk", mood: "Ethereal" },
      { title: "Flightless Bird, American Mouth", artist: "Iron & Wine", reason: "Warm, waltzing acoustic melody that matches a slow, drizzling afternoon.", genre: "Indie Folk", mood: "Nostalgic" }
    ]
  },
  Thunderstorm: {
    vibeDescription: "Electrifying storms demand dramatic sounds. Intense cinematic compositions, thunderous percussion, and dark, powerful rock tracks.",
    spotifyPlaylistId: "37i9dQZF1DX6Xv8w799uOP", // Intense Cinematic
    tracks: [
      { title: "Thunderstruck", artist: "AC/DC", reason: "An explosive rock anthem mirroring the lightning crackling above.", genre: "Hard Rock", mood: "Electrifying" },
      { title: "Blinding Lights", artist: "The Weeknd", reason: "Synthesized electricity that keeps the pulse racing during active storms.", genre: "Synthwave", mood: "Charged" },
      { title: "Intro", artist: "The xx", reason: "Moody, dramatic guitar loop with heavy bass echoing the distant thunder.", genre: "Indie Pop", mood: "Intense" },
      { title: "No Church in the Wild", artist: "Kanye West & Jay-Z", reason: "Heavy, dark basslines that match the sheer force of a lightning storm.", genre: "Hip Hop", mood: "Ominous" },
      { title: "Nightcall", artist: "Kavinsky", reason: "Retro-futuristic dark electronic beats suited for a dark, storm-swept drive.", genre: "Synthwave", mood: "Mysterious" }
    ]
  },
  Snow: {
    vibeDescription: "The silent falling of snow hushes the world. Drift into peaceful ambient piano, quiet winter acoustics, and delicate choral textures.",
    spotifyPlaylistId: "37i9dQZF1DX4H7mr2uFs6B", // Winter Acoustics
    tracks: [
      { title: "White Winter Hymnal", artist: "Fleet Foxes", reason: "Staggered folk harmonies that capture the crisp, frosty winter air.", genre: "Indie Folk", mood: "Choral / Cozy" },
      { title: "Saturn", artist: "Sleeping At Last", reason: "Beautiful orchestral swell that matches the slow, magical descent of snow.", genre: "Chamber Pop", mood: "Wonder" },
      { title: "Gymnopédie No.1", artist: "Erik Satie", reason: "Sparse, peaceful piano notes that perfectly capture a silent, snow-covered morning.", genre: "Classical", mood: "Serene" },
      { title: "Winter", artist: "The Dodos", reason: "Warm acoustic rhythms to stay cozy against the biting frost.", genre: "Indie Rock", mood: "Cozy" },
      { title: "Flume", artist: "Bon Iver", reason: "Isolated acoustic sounds that evoke feelings of fireside warmth amidst winter snow.", genre: "Indie Folk", mood: "Intimate" }
    ]
  }
};

const DEFAULT_VIBE = {
  vibeDescription: "A versatile atmosphere that calls for a balanced blend of chill vibes, soft indie rhythms, and gentle, mood-adaptive beats.",
  spotifyPlaylistId: "37i9dQZF1DXcBWIGmq6v8A", // Chill Vibes
  tracks: [
    { title: "Sunset Lover", artist: "Petit Biscuit", reason: "A soothing electronic tune that fits almost any transition of sky.", genre: "Chilled Electronic", mood: "Relaxed" },
    { title: "Chamber of Reflection", artist: "Mac DeMarco", reason: "Languid synth grooves that create a perfect, space-conscious atmosphere.", genre: "Indie Pop", mood: "Pensive" },
    { title: "Location", artist: "Khalid", reason: "Smooth, soulful R&B rhythm that blends effortlessly into the background.", genre: "R&B", mood: "Warm" },
    { title: "Teardrop", artist: "Massive Attack", reason: "Hypnotic, organic-electronic blend suitable for deep relaxation.", genre: "Trip Hop", mood: "Introspective" },
    { title: "Breezeblocks", artist: "alt-J", reason: "Quirky indie rhythms that keep the atmosphere fresh and interesting.", genre: "Indie Rock", mood: "Curious" }
  ]
};

// 1. Geocoding proxy
app.get("/api/search-city", async (req, res) => {
  const city = req.query.city;
  if (!city || typeof city !== "string") {
    res.status(400).json({ error: "City name is required" });
    return;
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const response = await fetch(geoUrl);
    if (!response.ok) {
      throw new Error("Failed to contact Geocoding API");
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Geocoding Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to locate city" });
  }
});

// 2. Weather fetching proxy
app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    res.status(400).json({ error: "Latitude and longitude are required" });
    return;
  }

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch weather forecast");
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Weather API Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to retrieve weather" });
  }
});

// Helper: map open-meteo code to simplified condition
function mapWeatherCodeToCondition(code: number): string {
  if (code === 0) return "Clear";
  if ([1, 2, 3, 45, 48].includes(code)) return "Clouds";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Clouds"; // fallback
}

// 3. Gemini integration to generate customized soundtrack vibe
app.post("/api/vibe", async (req, res) => {
  const { cityName, temp, condition, wind, isDay, humidity } = req.body;

  if (!cityName || condition === undefined) {
    res.status(400).json({ error: "City and weather condition are required" });
    return;
  }

  const simplifiedCondition = mapWeatherCodeToCondition(condition);

  // If Gemini client is not initialized, return high-quality local curated vibe fallback
  if (!ai) {
    console.log("No Gemini API Key, returning rich local fallback for:", simplifiedCondition);
    const fallback = LOCAL_VIBE_FALLBACKS[simplifiedCondition] || DEFAULT_VIBE;
    res.json({
      ...fallback,
      isAI: false,
      message: "Generated using local curation. Configure your Gemini API key in Settings > Secrets to unlock AI soundtracks!"
    });
    return;
  }

  try {
    const prompt = `You are an elite music curator, DJ, and atmospheric designer. 
Analyze the current weather conditions for the city of **${cityName}** and generate a custom "vibe profile" and soundtrack.

WEATHER DETAILS:
- Temperature: ${temp}°C
- Simplified Sky Condition: ${simplifiedCondition} (OpenMeteo code: ${condition})
- Time of Day: ${isDay ? "Daylight" : "Nighttime"}
- Wind Speed: ${wind} km/h
- Humidity: ${humidity}%

Based on this precise atmosphere, return a JSON object with:
1. "vibeDescription": A beautifully written, highly evocative, poetic, and cozy description (2-3 sentences) detailing the exact mood of this atmosphere and why the recommended soundtrack fits perfectly.
2. "spotifyPlaylistId": Choose the most fitting Spotify playlist ID from the following list that matches this sky condition:
   - Clear Sky (Sunny): '37i9dQZF1DX1BzILRveYHb' (Feel Good Indie) or '37i9dQZF1DX0b186vOt963' (Hot Hits)
   - Clouds / Overcast: '37i9dQZF1DX3rxVf6vfhns' (Chilling Top Tracks) or '37i9dQZF1DX4sWSpwq3LiO' (Atmospheric Calm)
   - Rain / Drizzle: '37i9dQZF1DX4sWSpwq3LiO' (Atmospheric Calm) or '37i9dQZF1DXbc9678rtnbR' (Rainy Day Jazz)
   - Thunderstorm: '37i9dQZF1DX6Xv8w799uOP' (Intense Cinematic) or '37i9dQZF1DX8U72mLI3mXv' (Alternative / Rock)
   - Snow: '37i9dQZF1DX4H7mr2uFs6B' (Winter Acoustics) or '37i9dQZF1DX0yE6vA7opHn' (Cozy Acoustics)
   - Defaults: '37i9dQZF1DXcBWIGmq6v8A' (Chill Vibes)
3. "tracks": An array of exactly 5 real, popular tracks/songs that fit this exact weather and location. Each track must be an object containing:
   - "title": Track name
   - "artist": Artist name
   - "reason": A single, beautiful, highly descriptive sentence explaining why this specific track resonates with the wind, light, and temperature in ${cityName} right now.
   - "genre": The song's genre (e.g. Indie Folk, Dream Pop, Trip Hop, Jazz)
   - "mood": The exact mood of the track (e.g. Melancholic, Radiant, Electric, Introspective)

Be creative, authentic, and pair genuine musical masterpieces. Use proper JSON format matching the schema. Do not write markdown markers or code blocks in the text response outside of the requested JSON structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["vibeDescription", "spotifyPlaylistId", "tracks"],
          properties: {
            vibeDescription: {
              type: Type.STRING,
              description: "A 2-3 sentence poetic description of the atmospheric mood and soundtrack choice."
            },
            spotifyPlaylistId: {
              type: Type.STRING,
              description: "The selected Spotify playlist ID from the provided curated options."
            },
            tracks: {
              type: Type.ARRAY,
              description: "Exactly 5 tailored real-world songs for this weather.",
              items: {
                type: Type.OBJECT,
                required: ["title", "artist", "reason", "genre", "mood"],
                properties: {
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  genre: { type: Type.STRING },
                  mood: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const result = JSON.parse(text);
    res.json({
      ...result,
      isAI: true
    });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error.message);
    // Graceful fallback to local curation if Gemini errors out
    const simplified = mapWeatherCodeToCondition(condition);
    const fallback = LOCAL_VIBE_FALLBACKS[simplified] || DEFAULT_VIBE;
    res.json({
      ...fallback,
      isAI: false,
      error: error.message || "Failed to customize vibe with AI, loaded local curation instead."
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
