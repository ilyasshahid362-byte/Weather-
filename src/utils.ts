import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  CloudSnow, 
  CloudLightning, 
  HelpCircle,
  LucideIcon
} from "lucide-react";

export interface WeatherUI {
  conditionName: string;
  description: string;
  icon: LucideIcon;
  theme: "sunny" | "cloudy" | "rainy" | "drizzle" | "snowy" | "stormy";
  bgGradient: string;
  accentColor: string;
}

export function getWeatherUI(code: number): WeatherUI {
  // Map Open-Meteo weather codes
  if (code === 0) {
    return {
      conditionName: "Clear",
      description: "Clear Blue Sky",
      icon: Sun,
      theme: "sunny",
      bgGradient: "from-amber-950/40 via-neutral-950 to-neutral-950",
      accentColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    };
  }
  
  if ([1, 2, 3].includes(code)) {
    return {
      conditionName: "Clouds",
      description: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast Skies",
      icon: Cloud,
      theme: "cloudy",
      bgGradient: "from-slate-900/50 via-neutral-950 to-neutral-950",
      accentColor: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    };
  }

  if ([45, 48].includes(code)) {
    return {
      conditionName: "Clouds",
      description: "Foggy & Misty",
      icon: Cloud,
      theme: "cloudy",
      bgGradient: "from-zinc-900/50 via-neutral-950 to-neutral-950",
      accentColor: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      conditionName: "Drizzle",
      description: "Soft Misty Drizzle",
      icon: CloudDrizzle,
      theme: "drizzle",
      bgGradient: "from-sky-950/40 via-neutral-950 to-neutral-950",
      accentColor: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      conditionName: "Rain",
      description: [61, 80].includes(code) ? "Light Showers" : "Steady Rain",
      icon: CloudRain,
      theme: "rainy",
      bgGradient: "from-indigo-950/40 via-neutral-950 to-neutral-950",
      accentColor: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      conditionName: "Snow",
      description: "Tumbling Snowflakes",
      icon: CloudSnow,
      theme: "snowy",
      bgGradient: "from-blue-950/30 via-neutral-950 to-neutral-950",
      accentColor: "text-blue-200 bg-blue-200/10 border-blue-200/20",
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      conditionName: "Thunderstorm",
      description: "Active Thunderstorm",
      icon: CloudLightning,
      theme: "stormy",
      bgGradient: "from-violet-950/40 via-neutral-950 to-neutral-950",
      accentColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    };
  }

  // Fallback
  return {
    conditionName: "Unknown",
    description: "Unspecified Conditions",
    icon: HelpCircle,
    theme: "cloudy",
    bgGradient: "from-neutral-900 via-neutral-950 to-neutral-950",
    accentColor: "text-neutral-400 bg-neutral-400/10 border-neutral-400/20",
  };
}
