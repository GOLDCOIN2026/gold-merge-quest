import { useState } from "react";
import { Send, Copy, Share2, Check, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { getReferralLink, shareText } from "@/game/bridge";
import { SFX } from "@/game/sound";
import { ModalPortal } from "@/components/game/ModalPortal";

/**
 * Telegram-style invitation system.
 * Generates a referral link and exposes native share + clipboard fallback.
 */
export function InviteButton() {
  const referralCredits = useGame(s => s.referralRefillCredits);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [link] = useState(() => getReferralLink());

  const inviteText =
    `🎮 Play Gold Coin Merge Quest with me — earn FREE Gold Coin rewards every day! ${link}`;

  async function handleShare() {
    SFX.click();
    const result = await shareText(inviteText);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  async function handleCopy() {
    SFX.click();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  function openTelegram() {
    SFX.click();
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
      "🎮 Play Gold Coin Merge Quest with me — earn FREE Gold Coin rewards every day!"
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        onClick={() => { SFX.click(); setOpen(true); }}
        className="panel-gold h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold hover:shadow-gold transition-shadow"
        aria-label="Invite friends"
      >
        <Send className="h-4 w-4 text-emerald-300" />
        <span className="hidden xs:inline">Invite</span>
      </button>

      <ModalPortal open={open} onClose={() => setOpen(false)}>
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="panel-gold rounded-3xl p-6 w-full max-w-sm shadow-popup animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-extrabold text-gold flex items-center gap-2">
                  <Send className="h-5 w-5 text-emerald-300" /> Invite Friends
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Earn 1 permanent refill credit per friend who joins.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-secondary/40 p-3 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-300 shrink-0" />
              <span className="text-xs text-muted-foreground">Refill credits earned:</span>
              <span className="ml-auto font-extrabold text-gold tabular-nums">{referralCredits}</span>
            </div>

            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Your referral link
            </label>
            <div className="mt-1 mb-3 panel-gold rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="flex-1 text-xs font-mono text-gold-200 truncate">{link}</span>
              <button
                onClick={handleCopy}
                className="h-8 w-8 rounded-lg bg-gradient-gold text-primary-foreground flex items-center justify-center shadow-gold shrink-0"
                aria-label="Copy link"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={openTelegram}
                className="h-12 rounded-xl font-bold bg-[hsl(200_85%_50%)] hover:bg-[hsl(200_85%_45%)] text-white shadow-md"
              >
                <Send className="h-4 w-4 mr-1.5" /> Telegram
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="h-12 rounded-xl font-bold border-gold-700/50 bg-secondary/50"
              >
                <Share2 className="h-4 w-4 mr-1.5" /> More…
              </Button>
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              {copied ? "Copied to clipboard!" : "Share via Telegram, WhatsApp, SMS, or any app."}
            </p>
          </div>
        </div>
      </ModalPortal>
    </>
  );
}
