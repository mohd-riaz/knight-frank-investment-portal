"use client";
import { useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/portal/parts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
export default function AcceptInvitation() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="login-page">
      <header className="login-header">
        <Brand />
        <span className="login-wordmark">GLOBAL INVESTMENT PORTAL</span>
      </header>
      <main className="login-form-wrap">
        <form
          style={{ maxWidth: 440, width: "100%", display: "grid", gap: 20 }}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            const form = new FormData(e.currentTarget);
            try {
              const response = await fetch("/api/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: new URLSearchParams(location.search).get("token"),
                  password: form.get("password"),
                }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);
              setDone(true);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h1>
            {done ? "You’re ready to sign in." : "Welcome to Knight Frank."}
          </h1>
          {done ? (
            <Link href="/login">Continue to sign in →</Link>
          ) : (
            <>
              <p className="muted">
                Set your password to accept your invitation.
              </p>
              <Label htmlFor="new-password">
                Password · at least 12 characters
              </Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
              {error && <p role="alert">{error}</p>}
              <Button disabled={busy}>
                {busy ? "Setting up your account…" : "Activate account"}
              </Button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
