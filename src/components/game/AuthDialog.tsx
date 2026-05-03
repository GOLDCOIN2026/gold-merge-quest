import { useState } from "react";
import { LogIn, X, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { SFX } from "@/game/sound";

interface Props { open: boolean; onClose: () => void; }

export function AuthDialog({ open, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function close() {
    SFX.click();
    setError(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!isFirebaseConfigured) {
      setError("Firebase isn't configured yet.");
      return;
    }
    setBusy("email");
    try {
      if (mode === "signup") {
        await signUpWithEmail(username, email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string })?.code;
      setError(prettyError(code) || (err as Error)?.message || "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    if (busy) return;
    SFX.click();
    setBusy("google");
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Google sign-in failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={close}
    >
      <div
        className="panel-gold rounded-3xl p-6 w-full max-w-sm shadow-popup animate-scale-in relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold mb-2">
            <LogIn className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-extrabold text-gold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "login" ? "Sign in to sync your progress." : "Save your progress to the cloud."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field icon={<UserIcon className="h-4 w-4" />}>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={2}
                maxLength={24}
                className="bg-transparent border-0 focus-visible:ring-0 h-11"
              />
            </Field>
          )}
          <Field icon={<Mail className="h-4 w-4" />}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-transparent border-0 focus-visible:ring-0 h-11"
            />
          </Field>
          <Field icon={<Lock className="h-4 w-4" />}>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="bg-transparent border-0 focus-visible:ring-0 h-11"
            />
          </Field>

          {error && (
            <p className="text-xs text-destructive font-medium text-center">{error}</p>
          )}

          <Button type="submit" disabled={busy !== null} className="btn-gold w-full h-12 font-extrabold rounded-xl">
            {busy === "email"
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : mode === "login" ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gold-700/40" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-gold-700/40" />
        </div>

        <Button
          onClick={google}
          disabled={busy !== null}
          variant="outline"
          className="w-full h-11 font-bold rounded-xl border-gold-700/50 bg-secondary/50"
        >
          {busy === "google" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Continue with Google
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => { SFX.click(); setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            className="font-bold text-gold-200 hover:text-gold underline-offset-2 hover:underline"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 panel-gold rounded-xl px-3 border border-gold-700/40">
      <span className="text-gold-300 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function prettyError(code?: string): string | null {
  switch (code) {
    case "auth/invalid-email": return "That email looks invalid.";
    case "auth/invalid-credential":
    case "auth/wrong-password": return "Wrong email or password.";
    case "auth/user-not-found": return "No account found for that email.";
    case "auth/email-already-in-use": return "An account already exists for that email.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/network-request-failed": return "Network error — please try again.";
    default: return null;
  }
}
