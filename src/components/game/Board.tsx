import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { GAME_CONFIG } from "@/game/config";
import { dropTile, selectCell, useGame, type Tile } from "@/game/store";
import { getItem, getCategory, MAX_LEVEL } from "@/game/items";
import { SFX } from "@/game/sound";
import { cn } from "@/lib/utils";

const SIZE = GAME_CONFIG.BOARD_SIZE;
const DRAG_THRESHOLD = 6;

interface DragState {
  from: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  ghost: Tile;
}

export function Board() {
  const board = useGame(s => s.board);
  const floats = useGame(s => s.floats);
  const particles = useGame(s => s.particles);
  const selectedCell = useGame(s => s.selectedCell);
  const phase = useGame(s => s.phase);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const tapSourceRef = useRef<{ idx: number; x: number; y: number; pointerId: number } | null>(null);

  const interactive = phase === "playing";

  function cellFromPoint(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const node = (el as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!node) return null;
    const idx = Number(node.dataset.cell);
    return Number.isFinite(idx) ? idx : null;
  }

  function onPointerDown(e: RPointerEvent<HTMLDivElement>, idx: number) {
    if (!interactive) return;
    const tile = board[idx];
    if (!tile) {
      selectCell(null);
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    tapSourceRef.current = { idx, x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  }

  function onPointerMove(e: RPointerEvent<HTMLDivElement>) {
    if (drag && e.pointerId === drag.pointerId) {
      setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY } : d);
      const cell = cellFromPoint(e.clientX, e.clientY);
      setHoverCell(cell);
      return;
    }
    const tap = tapSourceRef.current;
    if (!tap || tap.pointerId !== e.pointerId) return;
    const dx = e.clientX - tap.x;
    const dy = e.clientY - tap.y;
    if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
    const tile = board[tap.idx];
    if (!tile) { tapSourceRef.current = null; return; }
    SFX.pickup();
    setDrag({
      from: tap.idx,
      pointerId: tap.pointerId,
      startX: tap.x,
      startY: tap.y,
      x: e.clientX,
      y: e.clientY,
      ghost: tile,
    });
    tapSourceRef.current = null;
  }

  function endDrag(e: RPointerEvent<HTMLDivElement>) {
    if (drag && e.pointerId === drag.pointerId) {
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (cell != null && cell !== drag.from) {
        dropTile(drag.from, cell);
      }
      setDrag(null);
      setHoverCell(null);
      return;
    }
    const tap = tapSourceRef.current;
    if (tap && tap.pointerId === e.pointerId) {
      selectCell(tap.idx);
      SFX.click();
    }
    tapSourceRef.current = null;
  }

  const ghostTile: Tile | null = drag ? board[drag.from] : null;
  const isMergeTarget = (idx: number) => {
    if (!ghostTile || hoverCell !== idx) return false;
    const t = board[idx];
    return !!t
      && t.category === ghostTile.category
      && t.level === ghostTile.level
      && t.level < MAX_LEVEL;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[min(92vw,520px)] aspect-square mx-auto select-none touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="absolute inset-0 rounded-3xl panel-gold p-2 sm:p-3 shadow-popup">
        <div
          className="grid gap-1.5 sm:gap-2 h-full"
          style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        >
          {board.map((tile, idx) => {
            const isHover = hoverCell === idx && drag && idx !== drag.from;
            const isMergeable = isMergeTarget(idx);
            const isDragSource = drag?.from === idx;
            const isSelected = selectedCell === idx && !drag;
            return (
              <div
                key={idx}
                data-cell={idx}
                ref={(el) => { cellRefs.current[idx] = el; }}
                onPointerDown={(e) => onPointerDown(e, idx)}
                className={cn(
                  "tile-base relative rounded-xl flex items-center justify-center",
                  isHover && !tile && "tile-droptarget",
                  isMergeable && "tile-mergeable",
                  isSelected && "tile-selected",
                  tile && "tile-filled",
                )}
              >
                {tile && !isDragSource && <TileVisual tile={tile} />}
                {floats.filter(f => f.cell === idx).map(f => (
                  <span
                    key={f.id}
                    className={cn(
                      "absolute pointer-events-none font-bold text-sm sm:text-base animate-float-up z-30 drop-shadow-lg",
                      f.variant === "coin" && "text-gold-300",
                      f.variant === "token" && "text-emerald-300",
                      f.variant === "combo" && "text-accent",
                      f.variant === "xp" && "text-cyan-300",
                    )}
                  >
                    {f.text}
                  </span>
                ))}
                {particles.filter(p => p.cell === idx).map(p => (
                  <ParticleBurst key={p.id} category={p.category} level={p.level} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {drag && (
        <div
          className="fixed pointer-events-none z-50 tile-dragging rounded-xl"
          style={{
            width: cellRefs.current[drag.from]?.clientWidth ?? 60,
            height: cellRefs.current[drag.from]?.clientHeight ?? 60,
            left: drag.x,
            top: drag.y,
            transform: "translate(-50%, -50%) scale(1.15)",
          }}
        >
          <TileVisual tile={drag.ghost} />
        </div>
      )}
    </div>
  );
}

function TileVisual({ tile }: { tile: Tile }) {
  const item = getItem(tile.category, tile.level);
  const cat = getCategory(tile.category);
  const fresh = Date.now() - tile.bornAt < 500;
  return (
    <div
      className={cn(
        "relative w-full h-full flex items-center justify-center p-1",
        fresh && "animate-spawn",
      )}
      style={{
        // Faint category-tinted aura behind the icon
        background: `radial-gradient(circle at 50% 55%, ${cat.glow}, transparent 65%)`,
        borderRadius: "0.6rem",
      }}
    >
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        draggable={false}
        className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] pointer-events-none"
      />
      {/* Category dot (top-left) — color-only marker, no text */}
      <span
        className="absolute top-0.5 left-0.5 h-2 w-2 rounded-full"
        style={{ background: cat.hue, boxShadow: `0 0 6px ${cat.hue}` }}
        aria-label={cat.name}
      />
      {/* Level chip (bottom-right) */}
      <span className="absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold text-gold-200 tabular-nums drop-shadow">
        {tile.level}
      </span>
    </div>
  );
}

function ParticleBurst({ category, level }: { category: Tile["category"]; level: number }) {
  const cat = getCategory(category);
  const particles = Array.from({ length: 8 + level }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 40 + Math.random() * 30;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full animate-particle"
            style={{
              ["--px" as string]: `${px}px`,
              ["--py" as string]: `${py}px`,
              background: cat.hue,
              boxShadow: `0 0 8px ${cat.hue}`,
            }}
          />
        );
      })}
    </div>
  );
}
