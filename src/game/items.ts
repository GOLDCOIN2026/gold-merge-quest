// Item definitions for Gold Merge Boss
// Each tier merges into the next. Add more tiers freely.
import dust from "@/assets/items/01-gold-dust.png";
import nugget from "@/assets/items/02-gold-nugget.png";
import bar from "@/assets/items/03-gold-bar.png";
import coin from "@/assets/items/04-gold-coin.png";
import chest from "@/assets/items/05-gold-chest.png";
import vault from "@/assets/items/06-gold-vault.png";
import crown from "@/assets/items/07-golden-crown.png";

export interface ItemDef {
  level: number;
  name: string;
  image: string;
  /** Coins awarded when this tier is created via a merge. */
  mergeReward: number;
}

export const ITEMS: ItemDef[] = [
  { level: 1, name: "Gold Dust",    image: dust,   mergeReward: 1 },
  { level: 2, name: "Gold Nugget",  image: nugget, mergeReward: 3 },
  { level: 3, name: "Gold Bar",     image: bar,    mergeReward: 8 },
  { level: 4, name: "Gold Coin",    image: coin,   mergeReward: 20 },
  { level: 5, name: "Gold Chest",   image: chest,  mergeReward: 50 },
  { level: 6, name: "Gold Vault",   image: vault,  mergeReward: 120 },
  { level: 7, name: "Golden Crown", image: crown,  mergeReward: 300 },
];

export const MAX_LEVEL = ITEMS.length;
export const getItem = (level: number) => ITEMS[Math.min(Math.max(level, 1), MAX_LEVEL) - 1];
