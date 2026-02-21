interface DailyFactProps {
  fact: string;
}

export default function DailyFact({ fact }: DailyFactProps) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: "rgba(245, 197, 66, 0.1)",
        border: "1px solid rgba(245, 197, 66, 0.25)",
      }}
    >
      <div
        className="mb-1 font-bold"
        style={{ fontSize: 13, color: "var(--accent-dim)" }}
      >
        {"💡"} Did you know?
      </div>
      <div style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.5 }}>
        {fact}
      </div>
    </div>
  );
}
