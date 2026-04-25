// =====================================================
// GOLD MERGE BOSS — Item catalog
// 3 categories × 10 levels each = 30 unique items
// All categories share the same 6×6 board, but only items
// of the SAME category AND SAME level can merge.
// =====================================================

// ---- Gold Relics (warm gold) ----
import relic1  from "@/assets/items/relics/01-dust.png";
import relic2  from "@/assets/items/relics/02-nugget.png";
import relic3  from "@/assets/items/relics/03-bar.png";
import relic4  from "@/assets/items/relics/04-coin.png";
import relic5  from "@/assets/items/relics/05-chest.png";
import relic6  from "@/assets/items/relics/06-vault.png";
import relic7  from "@/assets/items/relics/07-crown.png";
import relic8  from "@/assets/items/relics/08-throne.png";
import relic9  from "@/assets/items/relics/09-scepter.png";
import relic10 from "@/assets/items/relics/10-imperial-treasure.png";

// ---- Blockchain Tech (cyan) ----
import bc1  from "@/assets/items/blockchain/01-chip.png";
import bc2  from "@/assets/items/blockchain/02-node.png";
import bc3  from "@/assets/items/blockchain/03-server.png";
import bc4  from "@/assets/items/blockchain/04-network.png";
import bc5  from "@/assets/items/blockchain/05-chain.png";
import bc6  from "@/assets/items/blockchain/06-ledger.png";
import bc7  from "@/assets/items/blockchain/07-validator.png";
import bc8  from "@/assets/items/blockchain/08-protocol.png";
import bc9  from "@/assets/items/blockchain/09-mainnet-core.png";
import bc10 from "@/assets/items/blockchain/10-quantum-chain.png";

// ---- Treasure Artifacts (emerald) ----
import tr1  from "@/assets/items/treasure/01-map-fragment.png";
import tr2  from "@/assets/items/treasure/02-compass.png";
import tr3  from "@/assets/items/treasure/03-key.png";
import tr4  from "@/assets/items/treasure/04-gem.png";
import tr5  from "@/assets/items/treasure/05-ring.png";
import tr6  from "@/assets/items/treasure/06-statue.png";
import tr7  from "@/assets/items/treasure/07-chalice.png";
import tr8  from "@/assets/items/treasure/08-artifact-chest.png";
import tr9  from "@/assets/items/treasure/09-royal-seal.png";
import tr10 from "@/assets/items/treasure/10-ancient-treasure.png";

export type CategoryId = "relics" | "blockchain" | "treasure";

export interface Category {
  id: CategoryId;
  name: string;
  short: string;          // 1–2 char chip label
  /** Tailwind-friendly accent for badges, glows, etc. */
  hue: string;            // CSS color
  glow: string;           // CSS color (alpha-friendly)
}

export const CATEGORIES: Record<CategoryId, Category> = {
  relics:     { id: "relics",     name: "Gold Relics",        short: "GR", hue: "hsl(43 96% 56%)",  glow: "hsl(43 96% 56% / 0.45)" },
  blockchain: { id: "blockchain", name: "Blockchain Tech",    short: "BC", hue: "hsl(195 95% 55%)", glow: "hsl(195 95% 55% / 0.45)" },
  treasure:   { id: "treasure",   name: "Treasure Artifacts", short: "TA", hue: "hsl(150 75% 50%)", glow: "hsl(150 75% 50% / 0.45)" },
};

export const CATEGORY_IDS: CategoryId[] = ["relics", "blockchain", "treasure"];

export interface ItemDef {
  category: CategoryId;
  level: number;
  name: string;
  image: string;
  /** Coins awarded when this tier is created via a merge. */
  mergeReward: number;
}

/** Coin reward curve for each merge tier (shared across categories). */
const MERGE_REWARDS = [1, 3, 8, 20, 50, 120, 300, 600, 1200, 2500];

function chain(category: CategoryId, names: string[], images: string[]): ItemDef[] {
  return names.map((name, i) => ({
    category,
    level: i + 1,
    name,
    image: images[i],
    mergeReward: MERGE_REWARDS[i],
  }));
}

const RELICS: ItemDef[] = chain(
  "relics",
  ["Gold Dust", "Gold Nugget", "Gold Bar", "Gold Coin", "Gold Chest", "Gold Vault", "Golden Crown", "Royal Throne", "Royal Scepter", "Imperial Treasure"],
  [relic1, relic2, relic3, relic4, relic5, relic6, relic7, relic8, relic9, relic10],
);

const BLOCKCHAIN: ItemDef[] = chain(
  "blockchain",
  ["Chip", "Node", "Server", "Network", "Chain", "Ledger", "Validator", "Protocol", "Mainnet Core", "Quantum Chain"],
  [bc1, bc2, bc3, bc4, bc5, bc6, bc7, bc8, bc9, bc10],
);

const TREASURE: ItemDef[] = chain(
  "treasure",
  ["Map Fragment", "Compass", "Key", "Gem", "Ring", "Statue", "Chalice", "Artifact Chest", "Royal Seal", "Ancient Treasure"],
  [tr1, tr2, tr3, tr4, tr5, tr6, tr7, tr8, tr9, tr10],
);

export const CATEGORY_ITEMS: Record<CategoryId, ItemDef[]> = {
  relics:     RELICS,
  blockchain: BLOCKCHAIN,
  treasure:   TREASURE,
};

export const ITEMS: ItemDef[] = [...RELICS, ...BLOCKCHAIN, ...TREASURE];

export const MAX_LEVEL = 10;

/** Look up a single item by category + level (1..10). */
export function getItem(category: CategoryId, level: number): ItemDef {
  const list = CATEGORY_ITEMS[category];
  const lvl = Math.min(Math.max(level, 1), MAX_LEVEL);
  return list[lvl - 1];
}

/** Return the category metadata. */
export function getCategory(id: CategoryId): Category {
  return CATEGORIES[id];
}
