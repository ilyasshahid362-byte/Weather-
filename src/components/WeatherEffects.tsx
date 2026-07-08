import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface WeatherEffectsProps {
  theme: "sunny" | "cloudy" | "rainy" | "drizzle" | "snowy" | "stormy";
}

export const WeatherEffects: React.FC<WeatherEffectsProps> = ({ theme }) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate theme-appropriate particles
    const newParticles = [];
    let count = 0;

    if (theme === "rainy" || theme === "stormy") {
      count = 40;
    } else if (theme === "drizzle") {
      count = 20;
    } else if (theme === "snowy") {
      count = 30;
    } else if (theme === "sunny") {
      count = 3; // Golden flares
    }

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 2 + (theme === "snowy" ? 3 : theme === "sunny" ? 12 : 1),
        size: theme === "sunny" ? Math.random() * 200 + 100 : Math.random() * 3 + 1,
        opacity: theme === "sunny" ? Math.random() * 0.15 + 0.05 : Math.random() * 0.6 + 0.2,
      });
    }

    setParticles(newParticles);
  }, [theme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background Gradients & Glow overlays */}
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          {theme === "sunny" && (
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-500/15 blur-[120px]" />
          )}
          {theme === "stormy" && (
            <div className="absolute top-0 inset-x-0 h-full bg-violet-600/5 blur-[150px]" />
          )}
          {theme === "rainy" && (
            <div className="absolute top-0 inset-x-0 h-full bg-indigo-500/5 blur-[150px]" />
          )}
          {theme === "snowy" && (
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/5 blur-[120px]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Render theme specific particles */}
      {theme === "sunny" && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-amber-400/20 blur-xl"
              style={{
                left: `${p.left}%`,
                top: `${p.left * 0.8}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                y: [0, -40, 0],
                opacity: [p.opacity, p.opacity * 1.5, p.opacity],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      {(theme === "rainy" || theme === "drizzle" || theme === "stormy") && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className={`absolute bg-gradient-to-b ${
                theme === "stormy" ? "from-violet-400 to-transparent" : "from-sky-400 to-transparent"
              }`}
              style={{
                left: `${p.left}%`,
                top: "-10px",
                width: theme === "drizzle" ? "1px" : "1.5px",
                height: theme === "drizzle" ? "15px" : "40px",
                opacity: p.opacity,
              }}
              animate={{
                y: ["0vh", "110vh"],
              }}
              transition={{
                duration: p.duration * 0.8,
                repeat: Infinity,
                ease: "linear",
                delay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      {theme === "stormy" && (
        <motion.div
          className="absolute inset-0 bg-white/20 z-10 mix-blend-overlay pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0, 0.4, 0, 0.1, 0, 0, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {theme === "snowy" && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-white blur-[0.5px]"
              style={{
                left: `${p.left}%`,
                top: "-10px",
                width: `${p.size + 1.5}px`,
                height: `${p.size + 1.5}px`,
                opacity: p.opacity,
              }}
              animate={{
                y: ["0vh", "110vh"],
                x: [0, Math.sin(p.id) * 40, 0],
              }}
              transition={{
                duration: p.duration * 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      {theme === "cloudy" && (
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute top-10 left-[-10%] w-96 h-32 bg-slate-400 rounded-full blur-[80px]"
            animate={{ x: ["0vw", "110vw"] }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-40 right-[-10%] w-80 h-28 bg-zinc-500 rounded-full blur-[70px]"
            animate={{ x: ["0vw", "-110vw"] }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
};
export default WeatherEffects;
