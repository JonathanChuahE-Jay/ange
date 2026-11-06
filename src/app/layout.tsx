import type { Metadata } from "next";
import { Caveat, Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
});

const hand = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "For You",
  description: "A little corner of the internet, made with love.",
  robots: { index: false, follow: false },
};

/**
 * Hides the boot loader once the page has really finished loading (images,
 * fonts…), shown for at least a moment so it never just flashes, and never
 * longer than MAX so a slow photo can't trap anyone on it. Runs inline before
 * React, and only flips a class on <html>.
 */
const BOOT_SCRIPT = `(function(){var d=document.documentElement,t0=Date.now(),MIN=700,MAX=7000,done=false;
function finish(){if(done)return;done=true;var w=Math.max(0,MIN-(Date.now()-t0));setTimeout(function(){d.classList.add('boot-done');},w);}
if(document.readyState==='complete')finish();else window.addEventListener('load',finish);
setTimeout(finish,MAX);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // the boot script adds a class to <html> before React hydrates
    <html lang="en" className={`${display.variable} ${hand.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        {/* loading screen — plain server HTML so it shows instantly, before any JS */}
        <div id="boot-loader" aria-hidden>
          <svg className="boot-heart" viewBox="0 0 64 64" width="64" height="64">
            <path
              d="M32 52.5 29.2 50C18.6 40.5 11.5 34.1 11.5 26.3 11.5 19.9 16.5 15 22.8 15c3.6 0 7 1.7 9.2 4.3C34.2 16.7 37.6 15 41.2 15c6.3 0 11.3 4.9 11.3 11.3 0 7.8-7.1 14.2-17.7 23.7Z"
              fill="#E8566F"
            />
          </svg>
          <p className="boot-text font-hand">loading our little world…</p>
          <span className="boot-bar" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
