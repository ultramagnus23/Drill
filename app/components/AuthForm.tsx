"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong.");
      setSubmitting(false);
      return;
    }
    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-5">
        <h1 className="font-serif text-2xl text-ink text-center mb-2">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs text-ink-quiet">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card border border-rule rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent-quiet"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs text-ink-quiet">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-card border border-rule rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent-quiet"
          />
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-ink text-paper text-sm rounded-md hover:opacity-90 disabled:opacity-40"
        >
          {mode === "login" ? "Sign in" : "Create account"}
        </button>

        <p className="text-xs text-ink-quiet text-center">
          {mode === "login" ? (
            <>
              No account? <Link href="/signup" className="underline underline-offset-4">Sign up</Link>
            </>
          ) : (
            <>
              Have an account? <Link href="/login" className="underline underline-offset-4">Sign in</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
