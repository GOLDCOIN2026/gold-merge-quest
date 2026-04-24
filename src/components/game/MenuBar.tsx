import { useState } from "react";
import { Pause, Play, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pauseGame, quitToMenu, resumeGame, useGame } from "@/game/store";
import { SFX } from "@/game/sound";

/**
 * Persistent in-game menu bar with Pause + Quit.
 * Quit triggers a confirmation dialog and saves before exiting.
 */
export function MenuBar() {
  const phase = useGame(s => s.phase);
  const [confirmQuit, setConfirmQuit] = useState(false);

  if (phase === "menu") return null;

  function togglePause() {
    SFX.click();
    if (phase === "paused") resumeGame();
    else pauseGame();
  }

  function askQuit() {
    SFX.click();
    if (phase === "playing") pauseGame();
    setConfirmQuit(true);
  }

  function doQuit() {
    SFX.click();
    setConfirmQuit(false);
    quitToMenu();
  }

  function cancelQuit() {
    SFX.click();
    setConfirmQuit(false);
    if (phase === "paused") resumeGame();
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={togglePause}
          className="panel-gold h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold hover:shadow-gold transition-shadow"
          aria-label={phase === "paused" ? "Resume" : "Pause"}
        >
          {phase === "paused"
            ? <Play className="h-4 w-4 text-gold-300" fill="currentColor" />
            : <Pause className="h-4 w-4 text-gold-300" fill="currentColor" />}
          <span className="hidden xs:inline">{phase === "paused" ? "Resume" : "Pause"}</span>
        </button>
        <button
          onClick={askQuit}
          className="panel-gold h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold hover:shadow-gold transition-shadow"
          aria-label="Quit"
        >
          <LogOut className="h-4 w-4 text-gold-300" />
          <span className="hidden xs:inline">Quit</span>
        </button>
      </div>

      {/* Pause overlay */}
      {phase === "paused" && !confirmQuit && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in">
          <div className="panel-gold rounded-3xl p-7 w-full max-w-xs text-center shadow-popup animate-scale-in">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold mb-4">
              <Pause className="h-8 w-8 text-primary-foreground" fill="currentColor" />
            </div>
            <h2 className="text-xl font-extrabold text-gold mb-1">Paused</h2>
            <p className="text-xs text-muted-foreground mb-5">Spawning is on hold.</p>
            <div className="space-y-2">
              <Button
                onClick={togglePause}
                className="btn-gold w-full h-12 font-bold rounded-xl"
              >
                <Play className="h-4 w-4 mr-2" fill="currentColor" /> Resume
              </Button>
              <Button
                onClick={() => { SFX.click(); setConfirmQuit(true); }}
                variant="outline"
                className="w-full h-11 font-semibold rounded-xl border-gold-700/50 bg-secondary/50"
              >
                <LogOut className="h-4 w-4 mr-2" /> Quit to Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quit confirmation */}
      {confirmQuit && (
        <div className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in">
          <div className="panel-gold rounded-3xl p-6 w-full max-w-xs text-center shadow-popup animate-scale-in">
            <h2 className="text-lg font-extrabold text-gold mb-1">Quit to Menu?</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Your progress will be saved.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={cancelQuit}
                variant="outline"
                className="h-11 font-semibold rounded-xl border-gold-700/50 bg-secondary/50"
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                onClick={doQuit}
                className="btn-gold h-11 font-bold rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-1" /> Quit
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
