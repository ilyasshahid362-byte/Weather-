export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string; // state/province
  country_code?: string;
}

export interface WeatherData {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface Track {
  title: string;
  artist: string;
  reason: string;
  genre: string;
  mood: string;
}

export interface VibeData {
  vibeDescription: string;
  spotifyPlaylistId: string;
  tracks: Track[];
  isAI: boolean;
  message?: string;
  error?: string;
}

export interface FavoriteVibe {
  id: string;
  cityName: string;
  country?: string;
  conditionName: string;
  temp: number;
  playlistId: string;
  timestamp: number;
}
