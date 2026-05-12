import { useEffect, useState } from "react";
import { LogIn, User as UserIcon, X, LogOut, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "./AuthContext";
import { useGame } from "@/game/store";
import { SFX } from "@/game/sound";
import { ModalPortal } from "@/components/game/ModalPortal";

type Mode = null | "login" | "profile";

/**
 * Header auth cluster: shows Login when signed out,
 * profile avatar when signed in.
 */
export function AuthButtons() {
  const { user, profile, loading, login, signOut, refreshProfile } = useAuth();

  const xp = useGame(s => s.xp);
  const level = useGame(s => s.level);
  const tokens = useGame(s => s.tokens);

  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function reset() {
    setEmail("");
    setPassword("");
    setErr(null);
  }

  function close() {
    setMode(null);
    reset();
  }

  useEffect(() => {
    if (mode === "profile") refreshProfile();
  }, [mode, refreshProfile]);

  async function onLogin() {
    setErr(null);

    if (!email || !password) {
      setErr("Enter email and password");
      return;
    }

    setBusy(true);

    try {
      await login(email.trim(), password);
      close();
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="h-9 w-20 rounded-full bg-secondary/40 animate-pulse" />
    );
  }

  return (
    <>
      {!user ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              SFX.click();
              setMode("login");
            }}
            className="panel-gold h-9 px-3 rounded-full flex items-center gap-1 text-[11px] font-bold hover:shadow-gold transition-shadow"
          >
            <LogIn className="h-3.5 w-3.5 text-gold-300" />
            Login
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            SFX.click();
            setMode("profile");
          }}
          className="panel-gold h-10 w-10 rounded-full flex items-center justify-center shadow-gold hover:scale-105 transition-transform"
          aria-label="Open profile"
        >
          <span className="text-sm font-extrabold text-gold uppercase">
            {(profile?.username ?? user.email ?? "U").charAt(0)}
          </span>
        </button>
      )}

      {/* ----- Login Modal ----- */}
      {mode === "login" && (
        <Modal title="Welcome back" onClose={close}>
          <Field
            label="Email"
            icon={<Mail className="h-4 w-4" />}
          >
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field
            label="Password"
            icon={<KeyRound className="h-4 w-4" />}
          >
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {err && (
            <p className="text-xs text-destructive">
              {err}
            </p>
          )}

          <Button
            className="btn-gold w-full h-11 rounded-xl font-extrabold mt-2"
            disabled={busy}
            onClick={onLogin}
          >
            {busy ? "Signing in…" : "Login"}
          </Button>
        </Modal>
      )}

      {/* ----- Profile Modal ----- */}
      {mode === "profile" && user && (
        <Modal title="Your Profile" onClose={close}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-14 w-14 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
              <UserIcon className="h-7 w-7 text-primary-foreground" />
            </div>

            <div className="min-w-0">
              <div className="text-base font-extrabold text-gold truncate">
                {profile?.username ?? user.displayName ?? "Player"}
              </div>

              <div className="text-[11px] text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
          </div>

          <Stat
            label="Tokens"
            value={(profile?.Tokens ?? profile?.TTokens ?? tokens).toLocaleString()}
          />

          <Stat
            label="Level"
            value={String(profile?.level ?? level)}
          />

          <Stat
            label="XP"
            value={(profile?.xp ?? xp).toLocaleString()}
          />

          {profile?.referralCode && (
            <Stat
              label="Referral code"
              value={profile.referralCode}
            />
          )}

          <Button
            variant="outline"
            className="w-full h-11 mt-3 rounded-xl border-gold-700/50 bg-secondary/50 font-bold"
            onClick={async () => {
              SFX.click();
              await signOut();
              close();
            }}
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign Out
          </Button>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <ModalPortal open onClose={onClose}>
      <div
        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="panel-gold rounded-3xl p-5 w-full max-w-sm shadow-popup animate-scale-in space-y-3"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gold">
              {title}
            </h2>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <span className="text-gold-300">
          {icon}
        </span>

        {label}
      </Label>

      {children}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
      <span className="text-xs text-muted-foreground">
        {label}
      </span>

      <span className="text-sm font-extrabold text-gold tabular-nums">
        {value}
      </span>
    </div>
  );
}
