import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Google AdSense auto-ad slot. The publisher script is loaded once in
 * index.html; this component just registers a placeholder <ins> block.
 *
 * NOTE: Without a configured `data-ad-slot` ID, AdSense will leave the
 * block empty in production. We render a styled placeholder so the layout
 * is still reserved.
 */
export function AdSlot({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense not loaded yet — silent */
    }
  }, []);

  return (
    <div className={`w-full overflow-hidden rounded-2xl ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", minHeight: 60 }}
        data-ad-client="ca-pub-7453907403877295"
        data-ad-slot=""
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
