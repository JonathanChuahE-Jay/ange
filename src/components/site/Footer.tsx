"use client";

import ShinyText from "@/components/kit/ShinyText";
import dynamic from "next/dynamic";
import { LazyScene } from "@/components/three/LazyScene";

const LanternScene = dynamic(() => import("@/components/three/LanternScene"), { ssr: false });

export function Footer({ text }: { text: string }) {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-dusk1 to-dusk0 px-5 pt-24 pb-36 md:pt-28 md:pb-40">
      <div aria-hidden className="stars-layer absolute inset-0 opacity-50" />
      <LazyScene className="absolute inset-0 opacity-70">{(active) => <LanternScene active={active} />}</LazyScene>
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <span className="petal left-[18%] text-rose-soft" style={{ animationDuration: "14s" }}>♥</span>
        <span className="petal left-[70%] text-goldsoft" style={{ animationDuration: "18s", animationDelay: "6s" }}>♥</span>
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
        {/* heart divider */}
        <div aria-hidden className="flex w-full max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/30" />
          <span className="icon-[lucide--heart] size-4.5 fill-rose text-rose" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/30" />
        </div>

        {text && (
          <p className="wrap max-w-2xl font-hand text-3xl md:text-4xl">
            <ShinyText text={text} color="#ffffff" shineColor="#F3C98B" speed={4} />
          </p>
        )}
      </div>
    </footer>
  );
}
