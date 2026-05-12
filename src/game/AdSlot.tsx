import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export const AdSlot = () => {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const scriptId = "adsbygoogle-script";

        // Load AdSense script once
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.id = scriptId;
          script.async = true;
          script.src =
            "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7453907403877295";
          script.crossOrigin = "anonymous";

          document.head.appendChild(script);

          script.onload = () => {
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
              console.error("AdSense load error:", e);
            }
          };
        } else {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.error("AdSense push error:", e);
          }
        }
      }
    } catch (err) {
      console.error("AdSlot error:", err);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-2xl panel-gold p-2">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7453907403877295"
        data-ad-slot="7352202986"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
