"use client";

import { useState, useEffect } from "react";
import { getRandomFact } from "@/lib/fun-facts";

export default function FunFactSpinner() {
  const [fact, setFact] = useState(getRandomFact);

  useEffect(() => {
    const interval = setInterval(() => {
      setFact(getRandomFact());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--background)" }}
    >
      <div className="text-center px-8" style={{ maxWidth: 360 }}>
        <div
          className="mb-4 text-5xl"
          style={{ animation: "poop-wobble 1.2s ease-in-out infinite" }}
        >
          {"💩"}
        </div>
        <p
          className="mb-2 font-bold"
          style={{ fontSize: 13, color: "var(--accent-dim)" }}
        >
          {"💡"} Did you know?
        </p>
        <p
          className="leading-relaxed"
          style={{
            fontSize: 14,
            color: "var(--foreground)",
            lineHeight: 1.6,
            transition: "opacity 0.3s ease",
          }}
        >
          {fact}
        </p>
      </div>

      <style>{`
        @keyframes poop-wobble {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.1); }
          75% { transform: rotate(15deg) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
