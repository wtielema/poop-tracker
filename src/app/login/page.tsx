"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
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
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--surface)",
              boxShadow: "var(--surface-shadow)",
            }}
          >
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="tap-bounce mb-4 flex w-full items-center justify-center gap-3 rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                height: "48px",
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "2px solid var(--border)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Redirecting..." : "Sign in with Google"}
            </button>

            {/* Divider */}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>or</span>
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit}>
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
                className="tap-bounce w-full rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-60"
                style={{
                  height: "48px",
                  background: "var(--accent)",
                  color: "var(--foreground)",
                }}
              >
                {loading ? "Sending..." : "Send Magic Link ✨"}
              </button>
            </form>
          </div>
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
