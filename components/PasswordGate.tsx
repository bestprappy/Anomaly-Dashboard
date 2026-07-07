"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { BarChart3, Loader2, Lock } from "lucide-react";

import { LoginError, isAuthed, login, subscribeToAuth } from "@/lib/auth";

/**
 * Full-screen sign-in gate. The check it fronts is enforced by the API —
 * every endpoint 401s without the bearer token issued at login — so
 * bypassing this component yields an empty dashboard, not the data.
 *
 * The password is a controlled input passed straight to fetch as JSON;
 * nothing here interprets user input as markup, so there is no injection
 * surface, and React escapes all rendered strings by default.
 */

interface PasswordGateProps {
  children: ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const inputId = useId();
  const errorId = useId();
  // sessionStorage is an external store; the server snapshot is "signed
  // out" so the static prerender always emits the gate, and an existing
  // session takes over right after hydration.
  const authed = useSyncExternalStore(subscribeToAuth, isAuthed, () => false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (pending || password.length === 0) return;
      setPending(true);
      setError(null);
      try {
        await login(password); // success notifies the auth store -> re-render
        setPassword("");
      } catch (err) {
        setError(
          err instanceof LoginError ? err.message : "Sign-in failed. Try again."
        );
      } finally {
        setPending(false);
      }
    },
    [pending, password]
  );

  if (authed) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card-elevated w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <BarChart3 className="h-6 w-6 text-primary-foreground" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-foreground">Billing EDA Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This dashboard is private. Enter the access password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id={inputId}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              disabled={pending}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={`input-base w-full ${error ? "border-destructive/60" : ""}`}
            />
          </div>

          {error ? (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || password.length === 0}
            className="btn-base btn-primary w-full justify-center"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Lock className="h-4 w-4" aria-hidden />
            )}
            {pending ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </main>
  );
}
