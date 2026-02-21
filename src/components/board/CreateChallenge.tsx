"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChallenge } from "@/app/actions/challenges";

interface CreateChallengeProps {
  onClose: () => void;
}

function formatDate(date: Date): string {
  return date.toISOString().substring(0, 10);
}

export default function CreateChallenge({ onClose }: CreateChallengeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"streak" | "count">("streak");
  const [target, setTarget] = useState(7);
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDate(d);
  });
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  function handleSubmit() {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (target < 1) {
      setError("Target must be at least 1");
      return;
    }
    if (endDate <= startDate) {
      setError("End date must be after start date");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await createChallenge({
        title: title.trim(),
        description: description.trim(),
        type,
        target,
        startDate,
        endDate,
      });

      if (result.success && result.challengeId) {
        // Build share URL
        let appUrl = window.location.origin;
        const url = `${appUrl}/board/challenge/${result.challengeId}`;
        setShareUrl(url);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create challenge");
      }
    });
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback: show the URL
    }
  }

  if (shareUrl) {
    return (
      <div
        className="rounded-xl p-5 space-y-4"
        style={{
          background: "var(--surface)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="text-center">
          <div style={{ fontSize: 48 }}>{"\uD83C\uDF89"}</div>
          <h3
            className="mt-2 font-bold"
            style={{ fontSize: 18, color: "var(--foreground)" }}
          >
            Challenge Created!
          </h3>
          <p
            className="mt-1"
            style={{ fontSize: 13, color: "var(--muted)" }}
          >
            Share the link with friends to invite them
          </p>
        </div>

        <div
          className="rounded-lg p-3 text-center break-all"
          style={{
            background: "var(--background)",
            fontSize: 12,
            color: "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          {shareUrl}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 rounded-xl py-3 font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--primary)",
              color: "#FFFFFF",
              fontSize: 14,
            }}
          >
            Copy Link {"\uD83D\uDCCB"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-3 font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--background)",
              color: "var(--muted)",
              fontSize: 14,
              border: "1px solid var(--border)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: "var(--surface)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="font-bold"
          style={{ fontSize: 18, color: "var(--foreground)" }}
        >
          New Challenge
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="font-bold transition-opacity hover:opacity-70"
          style={{ fontSize: 20, color: "var(--muted)" }}
        >
          {"\u00D7"}
        </button>
      </div>

      {/* Title */}
      <div>
        <label
          className="block mb-1 font-semibold"
          style={{ fontSize: 13, color: "var(--foreground)" }}
        >
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 7-Day Streak Challenge"
          maxLength={60}
          className="w-full rounded-lg px-3 py-2.5 outline-none transition-all"
          style={{
            fontSize: 14,
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Description */}
      <div>
        <label
          className="block mb-1 font-semibold"
          style={{ fontSize: 13, color: "var(--foreground)" }}
        >
          Description{" "}
          <span style={{ color: "var(--muted)", fontWeight: 400 }}>
            (optional)
          </span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this challenge about?"
          maxLength={120}
          className="w-full rounded-lg px-3 py-2.5 outline-none transition-all"
          style={{
            fontSize: 14,
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Type Selector */}
      <div>
        <label
          className="block mb-1 font-semibold"
          style={{ fontSize: 13, color: "var(--foreground)" }}
        >
          Type
        </label>
        <div
          className="flex gap-1 rounded-full p-1"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() => setType("streak")}
            className="flex-1 rounded-full py-2 text-center font-semibold transition-all"
            style={{
              fontSize: 13,
              background:
                type === "streak" ? "var(--accent)" : "transparent",
              color:
                type === "streak" ? "var(--foreground)" : "var(--muted)",
            }}
          >
            Streak {"\uD83D\uDD25"}
          </button>
          <button
            type="button"
            onClick={() => setType("count")}
            className="flex-1 rounded-full py-2 text-center font-semibold transition-all"
            style={{
              fontSize: 13,
              background:
                type === "count" ? "var(--accent)" : "transparent",
              color:
                type === "count" ? "var(--foreground)" : "var(--muted)",
            }}
          >
            Log Count {"\uD83D\uDCCA"}
          </button>
        </div>
      </div>

      {/* Target */}
      <div>
        <label
          className="block mb-1 font-semibold"
          style={{ fontSize: 13, color: "var(--foreground)" }}
        >
          Target
        </label>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
          min={1}
          max={365}
          className="w-full rounded-lg px-3 py-2.5 outline-none transition-all"
          style={{
            fontSize: 14,
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Date Range */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label
            className="block mb-1 font-semibold"
            style={{ fontSize: 13, color: "var(--foreground)" }}
          >
            Start
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 outline-none transition-all"
            style={{
              fontSize: 14,
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
        <div className="flex-1">
          <label
            className="block mb-1 font-semibold"
            style={{ fontSize: 13, color: "var(--foreground)" }}
          >
            End
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 outline-none transition-all"
            style={{
              fontSize: 14,
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          className="font-medium"
          style={{ fontSize: 13, color: "#e74c3c" }}
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-xl py-3 font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{
          background: "var(--primary)",
          color: "#FFFFFF",
          fontSize: 14,
        }}
      >
        {isPending ? "Creating..." : "Create Challenge \uD83C\uDFAF"}
      </button>
    </div>
  );
}
