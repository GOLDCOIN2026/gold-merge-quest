import { useEffect, useState } from "react";
import { LogIn, LogOut, X, Mail, Star, Gem, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onAuth, signOutUser, type AuthSnapshot } from "@/lib/auth";
import { useGame } from "@/game/store";
import { AuthDialog } from "./AuthDialog";
import { SFX } from "@/game/sound";

/**
 * Top-right header control:
 *   - Anonymous / signed-out  →  "Login" button
 *   - Signed in (email/google) →  Avatar that opens a profile sheet
 */
export function ProfileButton() {
  const [me, setMe] = useState<AuthSnapshot | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const tokens = useGame(s => s.tokens);
  const level = useGame(s => s.level);
  const xp = useGame(s => s.xp);

  useEffect(() => {
    const off = onAuth(setMe);
    return () => { off(); };
  }, []);

  const signedIn = !!me && !me.isAnonymous;

  if (!signedIn) {
    return (
      <>
        <button
          onClick={() => { SFX.click(); setAuthOpen(true); }}
          className="btn-gold h-10 px-4 rounded-full flex items-center gap-1.5 text-xs font-extrabold shadow-gold"
        >
          <LogIn className="h-4 w-4" />
          Login
        </button>
        <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => { SFX.click(); setProfileOpen(true); }}
        className="panel-gold h-10 w-10 rounded-full flex items-center justify-center overflow-hidden shadow-gold border border-gold-500/50"
        aria-label="Profile"
      >
        {me?.photo ? (
          <img src={me.photo} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="h-full w-full bg-gradient-gold text-primary-foreground text-sm font-extrabold flex items-center justify-center">
            {(me?.name || "?").charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {profileOpen && me && (
        <div
          className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="panel-gold rounded-3xl p-6 w-full max-w-sm shadow-popup animate-scale-in relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-4">
              <div className="mx-auto h-20 w-20 rounded-full overflow-hidden border-2 border-gold-500 shadow-gold-strong mb-3">
                {me.photo ? (
                  <img src={me.photo} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="h-full w-full bg-gradient-gold text-primary-foreground text-3xl font-extrabold flex items-center justify-center">
                    {me.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-gold">{me.name}</h2>
              {me.email && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" /> {me.email}
                </p>
              )}
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gold-300/80">
                {me.source === "google" ? "Google Account" : me.source === "email" ? "Email Account" : me.source}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat icon={<Gem className="h-4 w-4 text-emerald-300" />} label="TTokens" value={tokens.toLocaleString()} />
              <Stat icon={<Star className="h-4 w-4 text-gold-300" fill="currentColor" />} label="Level" value={level.toString()} />
              <Stat icon={<UserIcon className="h-4 w-4 text-cyan-300" />} label="XP" value={xp.toLocaleString()} />
            </div>

            <Button
              onClick={async () => { SFX.click(); await signOutUser(); setProfileOpen(false); }}
              variant="outline"
              className="w-full h-11 font-bold rounded-xl border-gold-700/50 bg-secondary/50"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel-gold rounded-xl p-2.5 text-center border border-gold-700/30">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-sm font-extrabold text-gold tabular-nums truncate">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
