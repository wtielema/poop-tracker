"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(urlError);
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-[480px] text-center">
        {/* Hero emoji with bounce */}
        <div className="mb-4 animate-bounce text-7xl" style={{ animationDuration: "2s" }}>
          💩
        </div>

        {/* App name */}
        <h1 className="mb-2 text-4xl font-extrabold" style={{ color: "var(--foreground)" }}>
          PoopLog
        </h1>

        {/* Tagline */}
        <p className="mb-10 text-lg font-medium" style={{ color: "var(--muted)" }}>
          Track it. Streak it. Share it.
        </p>

        {sent ? (
          /* Success state */
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "var(--surface-shadow)",
            }}
          >
            <div className="mb-4 text-5xl">📬</div>
            <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--foreground)" }}>
              Check your email!
            </h2>
            <p style={{ color: "var(--muted)" }}>
              We sent a magic link to <strong style={{ color: "var(--foreground)" }}>{email}</strong>.
              Click the link to sign in.
            </p>
          </div>
        ) : (
          /* Login form */
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "var(--surface-shadow)",
            }}
          >
            <label
              htmlFor="email"
              className="mb-2 block text-left text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-4 block w-full rounded-xl px-4 text-base outline-none transition-all focus:ring-2"
              style={{
                height: "48px",
                fontSize: "16px",
                border: "2px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                // focus ring color set below
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />

            {error && (
              <p className="mb-4 rounded-lg p-3 text-sm font-medium" style={{ background: "#FEE", color: "var(--danger)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                height: "48px",
                background: "var(--accent)",
                color: "var(--foreground)",
              }}
            >
              {loading ? "Sending..." : "Send Magic Link ✨"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
