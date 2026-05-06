import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Telegram WebApp init
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        setHeaderColor?: (c: string) => void;
        setBackgroundColor?: (c: string) => void;
        initDataUnsafe?: { start_param?: string; user?: { username?: string; first_name?: string; id?: number } };
      };
    };
  }
}
try {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#0b0d1a");
    tg.setBackgroundColor?.("#0b0d1a");
  }
} catch { /* noop */ }

createRoot(document.getElementById("root")!).render(<App />);
