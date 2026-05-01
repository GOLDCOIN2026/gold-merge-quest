import { useGame, finishTutorial, nextTutorialStep } from "@/game/store";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "Welcome to Gold Coin Merge Quest!",
    body: "Drag identical items onto each other to merge them into something more valuable.",
    emoji: "👑",
  },
  {
    title: "Three Categories",
    body: "Gold Relics (gold), Blockchain Tech (cyan), and Treasure Artifacts (emerald) — each with 12 evolution tiers. Items only merge with items of the same category and level.",
    emoji: "🎨",
  },
  {
    title: "Items Spawn Automatically",
    body: "A new tile appears every 3 seconds (1.5s during 2× Speed Boost). When the board fills, spawning pauses — clear space by merging.",
    emoji: "⚡",
  },
  {
    title: "Sell for Gold Tokens",
    body: "Reach Level 10, 11 or 12 to sell items for Gold Tokens. Level 10 = 10 · Level 11 = 50 · Level 12 = 100 tokens.",
    emoji: "💎",
  },
];

export function Tutorial() {
  const step = useGame(s => s.tutorialStep);
  const phase = useGame(s => s.phase);
  if (phase !== "playing") return null;
  if (step < 0 || step >= STEPS.length) return null;
  const s = STEPS[step];
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="panel-gold rounded-3xl p-6 max-w-sm w-full text-center animate-scale-in shadow-popup">
        <div className="text-4xl mb-3">{s.emoji}</div>
        <h2 className="text-xl font-bold text-gold mb-2">{s.title}</h2>
        <p className="text-sm text-muted-foreground mb-5">{s.body}</p>
        <div className="flex justify-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === step ? "bg-gradient-gold" : "bg-muted"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={finishTutorial} className="flex-1">Skip</Button>
          <Button
            onClick={() => step + 1 >= STEPS.length ? finishTutorial() : nextTutorialStep()}
            className="btn-gold flex-1 font-bold"
          >
            {step + 1 >= STEPS.length ? "Start Playing" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
