"use client";

import { useState, useCallback } from "react";

interface ShareButtonProps {
  userId: string;
  label?: string;
}

export default function ShareButton({
  userId,
  label = "Share Stats",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/profile`;
    const ogUrl = `${window.location.origin}/api/og?userId=${userId}`;

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My PoopLog Stats 💩",
          text: "Check out my poop stats!",
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
      console.warn("Clipboard API not available");
    }
  }, [userId]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-xl px-6 py-3 font-bold transition-all active:scale-95"
      style={{
        fontSize: 16,
        background: "var(--accent)",
        color: "var(--foreground)",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(245, 197, 66, 0.3)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {copied ? (
        <>Link copied! 📋</>
      ) : (
        <>
          📤 {label}
        </>
      )}
    </button>
  );
}
