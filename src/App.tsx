import React, { useEffect, useState, useRef } from "react";
import { 
  Search, 
  MapPin, 
  Heart, 
  Volume2, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  Info, 
  Sparkles, 
  Wind, 
  Droplets, 
  Thermometer,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  ListMusic,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { City, WeatherData, VibeData, FavoriteVibe, Track } from "./types";
import { getWeatherUI, WeatherUI } from "./utils";
import { WeatherEffects } from "./components/WeatherEffects";

// Helper for weather name to styling
const conditionBigTextMap: Record<string, { main: string; stroke: string }> = {
  Clear: { main: "SUNNY", stroke: "DAYS" },
  Clouds: { main: "CLOUDY", stroke: "SKIES" },
  Rain: { main: "RAINY", stroke: "DAYS" },
  Drizzle: { main: "MISTY", stroke: "DRIZZLE" },
  Thunderstorm: { main: "STORMY", stroke: "NIGHTS" },
  Snow: { main: "SNOWY", stroke: "PEAKS" },
  Unknown: { main: "CHILL", stroke: "VIBES" },
};

export default function App() {
  // Query & Dropdown States
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Active Weather & Vibe States
  const [selectedCity, setSelectedCity] = useState<City>({
    id: 2643743,
    name: "London",
    latitude: 51.50853,
    longitude: -0.12574,
    country: "United Kingdom",
    country_code: "GB",
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [vibe, setVibe] = useState<VibeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteVibe[]>([]);

  // Spotify Embed Mode State
  const [showSpotifyEmbed, setShowSpotifyEmbed] = useState(false);

  // Simulated Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [songProgress, setSongProgress] = useState(35); // simulated percentage
  const [currentTime, setCurrentTime] = useState("01:24");
  const [volume, setVolume] = useState(80);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Favorite Fetch
  useEffect(() => {
    // Load favorites from local storage
    const saved = localStorage.getItem("weather_soundtrack_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    // Fetch default city weather & vibe
    fetchWeatherAndVibe(selectedCity);
  }, []);

  // 2. Fetch Suggestions as user types
  useEffect(() => {
    if (cityQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/search-city?city=${encodeURIComponent(cityQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
        }
      } catch (err) {
        console.error("Geocoding fetch failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [cityQuery]);

  // Click outside suggestions list to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simulated player progress timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setSongProgress((prev) => {
          if (prev >= 100) {
            // cycle to next song
            handleNextTrack();
            return 0;
          }
          const nextVal = prev + 0.5;
          
          // calculate time string
          const totalSeconds = 215; // standard simulated song length (3:35)
          const currentSec = Math.floor((nextVal / 100) * totalSeconds);
          const mins = Math.floor(currentSec / 60);
          const secs = currentSec % 60;
          setCurrentTime(`0${mins}:${secs < 10 ? "0" : ""}${secs}`);
          
          return nextVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeTrackIndex, vibe]);

  // Reset progress when track changes
  useEffect(() => {
    setSongProgress(0);
    setCurrentTime("00:00");
  }, [activeTrackIndex]);

  // Handle Fetching Weather and Soundtrack Vibe
  async function fetchWeatherAndVibe(city: City) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Step A: Fetch Weather
      const weatherResponse = await fetch(`/api/weather?lat=${city.latitude}&lon=${city.longitude}`);
      if (!weatherResponse.ok) {
        throw new Error("Failed to load weather forecast statistics.");
      }
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      setWeather(current);

      // Step B: Fetch AI or curated vibe from our full-stack endpoint
      const vibeResponse = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: city.name,
          temp: Math.round(current.temperature_2m),
          condition: current.weather_code,
          wind: current.wind_speed_10m,
          isDay: current.is_day,
          humidity: current.relative_humidity_2m
        })
      });

      if (!vibeResponse.ok) {
        throw new Error("Failed to curate music playlist for this sky.");
      }

      const vibeData: VibeData = await vibeResponse.json();
      setVibe(vibeData);
      setActiveTrackIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while loading your sky's soundtrack.");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle City Selection
  function handleSelectCity(city: City) {
    setSelectedCity(city);
    setCityQuery("");
    setShowSuggestions(false);
    fetchWeatherAndVibe(city);
  }

  // Handle Add/Remove Favorite
  function toggleFavorite() {
    if (!weather || !vibe) return;

    const exists = favorites.find((f) => f.cityName.toLowerCase() === selectedCity.name.toLowerCase());
    let newFavorites: FavoriteVibe[] = [];

    if (exists) {
      newFavorites = favorites.filter((f) => f.cityName.toLowerCase() !== selectedCity.name.toLowerCase());
    } else {
      const weatherUI = getWeatherUI(weather.weather_code);
      const newFav: FavoriteVibe = {
        id: selectedCity.id.toString() + Date.now(),
        cityName: selectedCity.name,
        country: selectedCity.country,
        conditionName: weatherUI.conditionName,
        temp: Math.round(weather.temperature_2m),
        playlistId: vibe.spotifyPlaylistId,
        timestamp: Date.now()
      };
      newFavorites = [newFav, ...favorites];
    }

    setFavorites(newFavorites);
    localStorage.setItem("weather_soundtrack_favorites", JSON.stringify(newFavorites));
  }

  function deleteFavorite(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const newFavs = favorites.filter((f) => f.id !== id);
    setFavorites(newFavs);
    localStorage.setItem("weather_soundtrack_favorites", JSON.stringify(newFavs));
  }

  // Player controls
  function handlePlayPause() {
    setIsPlaying(!isPlaying);
  }

  function handleNextTrack() {
    if (!vibe || !vibe.tracks || vibe.tracks.length === 0) return;
    setActiveTrackIndex((prev) => (prev + 1) % vibe.tracks.length);
  }

  function handlePrevTrack() {
    if (!vibe || !vibe.tracks || vibe.tracks.length === 0) return;
    setActiveTrackIndex((prev) => (prev - 1 + vibe.tracks.length) % vibe.tracks.length);
  }

  // Quick select a curated track to play
  function selectTrack(index: number) {
    setActiveTrackIndex(index);
    setIsPlaying(true);
  }

  // Prepare UI elements based on weather code
  const weatherCode = weather ? weather.weather_code : 0;
  const weatherUI: WeatherUI = getWeatherUI(weatherCode);
  const bigTexts = conditionBigTextMap[weatherUI.conditionName] || conditionBigTextMap.Unknown;

  const currentTrack: Track | null = vibe && vibe.tracks && vibe.tracks[activeTrackIndex] 
    ? vibe.tracks[activeTrackIndex] 
    : vibe && vibe.tracks && vibe.tracks[0] 
      ? vibe.tracks[0] 
      : null;

  const upcomingTrack: Track | null = vibe && vibe.tracks && vibe.tracks[(activeTrackIndex + 1) % vibe.tracks.length]
    ? vibe.tracks[(activeTrackIndex + 1) % vibe.tracks.length]
    : null;

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden relative transition-all duration-1000 bg-gradient-to-b ${weatherUI.bgGradient}`}>
      
      {/* Dynamic Interactive Weather Particles Overlay */}
      <WeatherEffects theme={weatherUI.theme} />

      {/* Decorative Grid Lines Overlay for Technical/Bold aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* HEADER / NAVIGATION */}
      <nav id="app-nav" className="relative z-30 flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-6 border-b border-white/5 backdrop-blur-sm gap-4">
        <div className="flex flex-col items-center md:items-start">
          <div className="text-[10px] font-black tracking-[0.35em] uppercase text-indigo-400">
            Weather / Soundtrack / v.2.4
          </div>
          <div className="text-xs opacity-50 mt-0.5 tracking-wider font-mono">
            Shahid Manzoor • 2026 UTC
          </div>
        </div>

        {/* Dynamic Search Box with Geocoding autocomplete dropdown */}
        <div ref={searchContainerRef} className="relative w-full max-w-md">
          <div className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 focus-within:bg-white/10 border border-white/10 rounded-full px-5 py-2.5 transition-all duration-300">
            <Search className="w-4 h-4 opacity-40 shrink-0" />
            <input
              type="text"
              placeholder="Search major cities (e.g., Tokyo, Paris)..."
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="bg-transparent border-none text-sm w-full placeholder-white/30 focus:outline-none"
            />
            {isSearching && (
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 backdrop-blur-md"
              >
                <div className="px-4 py-2 border-b border-white/5 text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                  Matching Locations
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {suggestions.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className="w-full text-left px-5 py-3 hover:bg-white/5 flex items-center justify-between border-b border-white/5 group transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 opacity-65 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="font-semibold text-sm block text-white group-hover:text-indigo-400 transition-colors">
                            {city.name}
                          </span>
                          <span className="text-xs text-white/40 block mt-0.5">
                            {city.admin1 ? `${city.admin1}, ` : ""}{city.country}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/60 uppercase">
                        {city.country_code}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Active Status Indicator & Favorites List Link */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleFavorite}
            className={`p-2.5 rounded-full border transition-all duration-300 ${
              favorites.some((f) => f.cityName.toLowerCase() === selectedCity.name.toLowerCase())
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}
            title="Save City to Favorites"
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative group">
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-950 animate-pulse" />
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 relative z-20 items-center">
        
        {/* LEFT COLUMN: HERO AREA (Massive Bold Typography & Weather stats) */}
        <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left h-full py-4 relative">
          
          {/* Quick weather badge */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
            <span className="text-xs font-black tracking-[0.4em] uppercase text-indigo-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              CURRENT CONDITIONS
            </span>
            <div className="h-px w-12 bg-indigo-400/30" />
            <span className="text-xs font-mono tracking-widest text-white bg-white/5 border border-white/10 rounded-full px-3.5 py-1 flex items-center gap-1.5">
              {weather ? (
                <>
                  <Thermometer className="w-3.5 h-3.5 text-indigo-300" />
                  {Math.round(weather.temperature_2m)}°C
                </>
              ) : (
                "--°C"
              )}
            </span>
            <span className="text-xs font-mono tracking-widest text-white bg-white/5 border border-white/10 rounded-full px-3.5 py-1">
              {selectedCity.name.toUpperCase()}
            </span>
          </div>

          {/* Dynamic Bold Typography Headers */}
          <div className="relative">
            <h1 className="text-[64px] sm:text-[90px] md:text-[120px] lg:text-[140px] xl:text-[160px] font-black leading-[0.85] tracking-tighter uppercase mb-4 break-words">
              {isLoading ? (
                <span className="animate-pulse bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                  LOADING
                </span>
              ) : (
                bigTexts.main
              )}
              <br />
              <span 
                className="text-transparent transition-all duration-1000 block" 
                style={{ WebkitTextStroke: "2px rgba(255,255,255,0.25)" }}
              >
                {isLoading ? "VIBES" : bigTexts.stroke}
              </span>
            </h1>
          </div>

          {/* EVOCATIVE ATMOSPHERE DESCRIPTION */}
          <div className="mt-6 md:mt-8 max-w-xl">
            {isLoading ? (
              <div className="space-y-2.5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-5/6" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </div>
            ) : (
              <p className="text-lg font-medium opacity-70 leading-relaxed text-white tracking-wide">
                {vibe?.vibeDescription || "Fetching a curated blend of ambient melodies perfectly tailored for your environment..."}
              </p>
            )}
          </div>

          {/* WEATHER STATS BAR (Dynamic indicators) */}
          <div className="grid grid-cols-3 gap-3 max-w-md mt-10">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center lg:items-start group hover:border-white/10 transition-all">
              <Wind className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">Wind Speed</span>
              <span className="text-lg font-black mt-1 font-mono">{weather ? `${Math.round(weather.wind_speed_10m)} km/h` : "--"}</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center lg:items-start group hover:border-white/10 transition-all">
              <Droplets className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">Humidity</span>
              <span className="text-lg font-black mt-1 font-mono">{weather ? `${weather.relative_humidity_2m}%` : "--"}</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center lg:items-start group hover:border-white/10 transition-all">
              {weather && weather.is_day === 0 ? (
                <Moon className="w-5 h-5 text-indigo-300 mb-2 group-hover:scale-110 transition-transform" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">Time</span>
              <span className="text-lg font-black mt-1 uppercase tracking-wider">{weather ? (weather.is_day ? "Day" : "Night") : "--"}</span>
            </div>
          </div>

          {/* FAVORITE CITIES SECTION */}
          {favorites.length > 0 && (
            <div className="mt-8 text-left hidden md:block">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase block mb-3">Saved Atmosphere Profiles</span>
              <div className="flex flex-wrap gap-2">
                {favorites.slice(0, 5).map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => {
                      setSelectedCity({
                        id: Number(fav.id.substring(0, 7)) || 0,
                        name: fav.cityName,
                        latitude: 0, // Fallback, we'll fetch geo or just re-select
                        longitude: 0,
                        country: fav.country
                      });
                      fetchWeatherAndVibe({
                        id: Number(fav.id.substring(0, 7)) || 0,
                        name: fav.cityName,
                        latitude: fav.cityName === "London" ? 51.50853 : 48.8566, // simple routing or search
                        longitude: fav.cityName === "London" ? -0.12574 : 2.3522,
                        country: fav.country
                      });
                    }}
                    className="group bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-400/30 rounded-full px-3.5 py-1.5 text-xs flex items-center space-x-2 transition-all duration-300"
                  >
                    <span className="font-semibold text-white group-hover:text-indigo-400">{fav.cityName}</span>
                    <span className="text-white/30 font-mono">{fav.temp}°C</span>
                    <span className="text-[9px] bg-white/10 group-hover:bg-indigo-500/20 px-1.5 py-0.5 rounded text-white/60">
                      {fav.conditionName}
                    </span>
                    <Trash2 
                      className="w-3 h-3 text-white/20 hover:text-rose-400 transition-colors ml-1"
                      onClick={(e) => deleteFavorite(fav.id, e)} 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MUSIC DISCOVERY AND TRACKLIST / SPOTIFY PLAYER */}
        <div className="lg:col-span-5 flex flex-col justify-start w-full relative h-full">
          
          {/* Main Panel Box */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col min-h-[480px]">
            
            {/* Header with Switcher Tabs */}
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowSpotifyEmbed(false)}
                  className={`text-xs font-bold tracking-[0.2em] uppercase pb-2 transition-all relative ${
                    !showSpotifyEmbed ? "text-indigo-400" : "text-white/40 hover:text-white"
                  }`}
                >
                  Tailored Tracks
                  {!showSpotifyEmbed && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
                  )}
                </button>
                <button
                  onClick={() => setShowSpotifyEmbed(true)}
                  className={`text-xs font-bold tracking-[0.2em] uppercase pb-2 transition-all relative ${
                    showSpotifyEmbed ? "text-indigo-400" : "text-white/40 hover:text-white"
                  }`}
                >
                  Live Web Player
                  {showSpotifyEmbed && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
                  )}
                </button>
              </div>

              {/* API Info badge */}
              <div className="flex items-center space-x-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 rounded-full px-3 py-1 text-[9px] font-bold tracking-wider uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{vibe?.isAI ? "AI Generated Vibe" : "Curated Vibe"}</span>
              </div>
            </div>

            {/* Error or Warnings message */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl p-3 mb-4">
                {errorMessage}
              </div>
            )}

            {/* VIEW A: TRACKLIST (5 Custom recommended tracks) */}
            <AnimatePresence mode="wait">
              {!showSpotifyEmbed ? (
                <motion.div
                  key="tracklist"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 bg-white/5 border border-white/5 rounded-2xl p-4 animate-pulse">
                          <div className="w-10 h-10 rounded-xl bg-white/10" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-white/10 rounded w-1/3" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : vibe && vibe.tracks && vibe.tracks.length > 0 ? (
                      vibe.tracks.map((track, index) => (
                        <button
                          key={index}
                          onClick={() => selectTrack(index)}
                          className={`w-full text-left flex items-start space-x-4 border rounded-2xl p-4 transition-all duration-300 group hover:bg-white/10 relative overflow-hidden ${
                            index === activeTrackIndex
                              ? "bg-indigo-500/10 border-indigo-500/30 text-white shadow-lg"
                              : "bg-white/5 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-300 ${
                            index === activeTrackIndex
                              ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-300"
                              : "bg-white/5 border-white/10 text-white/50"
                          }`}>
                            {index === activeTrackIndex && isPlaying ? (
                              <div className="flex items-end justify-center space-x-0.5 h-4 w-4">
                                <span className="w-0.5 bg-indigo-400 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" />
                                <span className="w-0.5 bg-indigo-400 rounded-full animate-[soundwave_1.2s_ease-in-out_infinite_0.2s] h-3" />
                                <span className="w-0.5 bg-indigo-400 rounded-full animate-[soundwave_1s_ease-in-out_infinite_0.4s] h-2.5" />
                              </div>
                            ) : (
                              <span className="text-xs font-mono font-black">0{index + 1}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-sm truncate pr-2 group-hover:text-indigo-300 transition-colors">
                                {track.title}
                              </h4>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60 shrink-0 capitalize">
                                {track.mood}
                              </span>
                            </div>
                            <p className="text-xs text-white/50 truncate mt-0.5">{track.artist}</p>
                            
                            {/* Poetic contextual reason */}
                            <p className="text-xs text-white/40 mt-2 italic border-l-2 border-indigo-500/20 pl-2 leading-relaxed">
                              {track.reason}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-50">
                        <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No curated tracks available. Enter a city above to load a live profile.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      Click any song above to cue interactive deck
                    </span>
                    <button 
                      onClick={() => setShowSpotifyEmbed(true)}
                      className="text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      Web Player
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* VIEW B: SPOTIFY LIVE EMBED PLAYER */
                <motion.div
                  key="spotify"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative min-h-[352px]">
                    {vibe?.spotifyPlaylistId ? (
                      <iframe
                        id="spotify-iframe-player"
                        style={{ borderRadius: "12px" }}
                        src={`https://open.spotify.com/embed/playlist/${vibe.spotifyPlaylistId}?utm_source=generator&theme=0`}
                        width="100%"
                        height="352"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="border-0 shadow-inner w-full h-[352px]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[352px] text-center p-6 text-white/40">
                        <Music className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">Spotify player not ready. Search for a city to load a live environment.</p>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-white/40 text-center mt-3 leading-relaxed">
                    Playing curated Spotify Playlist: <span className="font-bold text-white/60">{vibe?.spotifyPlaylistId || "—"}</span>. Open in Spotify to add to your account library.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </main>

      {/* FOOTER AUDIO BAR (High quality interactive player controls) */}
      <footer id="audio-footer-deck" className="relative z-30 bg-slate-950/85 backdrop-blur-xl border-t border-white/10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Foot Col 1: Currently Playing Info */}
        <div className="md:col-span-3 flex items-center space-x-4 w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-950 to-neutral-900 rounded-xl flex items-center justify-center border border-white/15 shadow-2xl overflow-hidden relative shrink-0 group">
            {/* Pulsating backdrop rings */}
            <div className={`absolute inset-0 bg-indigo-500/10 transition-all duration-700 ${isPlaying ? "scale-125 opacity-100" : "scale-100 opacity-0"}`} />
            
            {/* Custom vector audio visualizer bars */}
            <div className="absolute inset-0 flex items-center justify-center space-x-1">
              <span className={`w-1 h-7 bg-indigo-400 rounded-full transition-all duration-500 ${isPlaying ? "animate-[soundwave_0.8s_ease-in-out_infinite]" : "h-2 bg-indigo-400/40"}`} />
              <span className={`w-1 h-11 bg-indigo-400 rounded-full transition-all duration-500 ${isPlaying ? "animate-[soundwave_1.1s_ease-in-out_infinite_0.1s]" : "h-4 bg-indigo-400/40"}`} />
              <span className={`w-1.5 h-6 bg-indigo-300 rounded-full transition-all duration-500 ${isPlaying ? "animate-[soundwave_0.7s_ease-in-out_infinite_0.3s]" : "h-1 bg-indigo-400/40"}`} />
              <span className={`w-1 h-9 bg-indigo-400 rounded-full transition-all duration-500 ${isPlaying ? "animate-[soundwave_1s_ease-in-out_infinite_0.2s]" : "h-3 bg-indigo-400/40"}`} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black truncate group-hover:text-indigo-400 transition-colors">
              {currentTrack ? currentTrack.title : "Midnight Drift"}
            </h3>
            <p className="text-xs opacity-50 uppercase tracking-widest mt-1 truncate font-medium">
              {currentTrack ? currentTrack.artist : "Curated Atmosphere"}
            </p>
          </div>
        </div>

        {/* Foot Col 2: Player Controls & Progress bar */}
        <div className="md:col-span-6 flex flex-col items-center justify-center w-full max-w-xl mx-auto">
          {/* Deck Buttons */}
          <div className="flex items-center space-x-6 mb-3">
            <button 
              onClick={handlePrevTrack}
              disabled={isLoading || !vibe}
              className="p-1 text-white/50 hover:text-white disabled:opacity-30 transition-all active:scale-95"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-30 transition-transform cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current stroke-none" />
              ) : (
                <Play className="w-5 h-5 fill-current stroke-none translate-x-0.5" />
              )}
            </button>

            <button 
              onClick={handleNextTrack}
              disabled={isLoading || !vibe}
              className="p-1 text-white/50 hover:text-white disabled:opacity-30 transition-all active:scale-95"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Interactive Progress Scrubber */}
          <div className="w-full flex items-center space-x-3.5">
            <span className="text-[10px] opacity-40 font-mono tracking-wider">{currentTime}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group">
              <div 
                className="h-full bg-indigo-500 rounded-full relative group-hover:bg-indigo-400 transition-colors"
                style={{ width: `${songProgress}%` }}
              />
            </div>
            <span className="text-[10px] opacity-40 font-mono tracking-wider">03:35</span>
          </div>
        </div>

        {/* Foot Col 3: Up Next description & Volume Control */}
        <div className="md:col-span-3 flex justify-end items-center space-x-6 w-full">
          <div className="text-right hidden xl:block min-w-0 flex-1">
            <span className="block text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400">Up Next</span>
            <span className="block text-xs font-bold truncate mt-0.5">
              {upcomingTrack ? `${upcomingTrack.title} — ${upcomingTrack.artist}` : "Cued soundtrack track..."}
            </span>
          </div>
          
          {/* Quick Volume Slider */}
          <div className="flex items-center space-x-2.5 bg-white/5 border border-white/5 rounded-full px-3.5 py-2 shrink-0">
            <Volume2 className="w-4 h-4 text-white/40" />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 accent-indigo-400 bg-white/10 h-1 rounded-full cursor-pointer appearance-none" 
            />
          </div>
        </div>

      </footer>

    </div>
  );
}
