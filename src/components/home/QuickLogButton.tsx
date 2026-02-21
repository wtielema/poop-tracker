"use client";

import Link from "next/link";

export default function QuickLogButton() {
  return (
    <div className="flex flex-col items-center">
      <Link
        href="/log"
        className="flex items-center justify-center rounded-full transition-transform active:scale-95 hover:scale-105"
        style={{
          width: 80,
          height: 80,
          background: "var(--primary)",
          boxShadow: "0 4px 16px rgba(139, 94, 60, 0.35)",
          textDecoration: "none",
          fontSize: 36,
        }}
      >
        <span role="img" aria-label="Log">
          {"\uD83D\uDCA9"}
        </span>
      </Link>
      <span
        className="mt-2"
        style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}
      >
        Log
      </span>
    </div>
  );
}
